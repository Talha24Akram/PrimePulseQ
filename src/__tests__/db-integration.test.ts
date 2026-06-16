// @vitest-environment node
//
// Real Postgres integration test using PGlite (Postgres compiled to WASM).
// Applies the actual migration files from supabase/migrations and exercises
// the atomic submit RPC and the sliding-window rate limiter against a live DB.
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function migration(name: string): string {
  return readFileSync(join(MIGRATIONS_DIR, name), "utf8");
}

let db: PGlite;

beforeAll(async () => {
  db = await PGlite.create();

  // Stub the Supabase-provided `auth` schema the migrations depend on.
  // Include the columns the handle_new_user trigger reads so it runs for real.
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb
    );
    create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  `);

  // Apply migrations in ascending filename order, exactly like production.
  await db.exec(migration("20260101000000_initial_schema.sql"));
  await db.exec(migration("20260101000001_rate_limiting.sql"));
  await db.exec(migration("20260615000000_atomic_submit_response.sql"));
  await db.exec(migration("20260615000001_sliding_window_rate_limit.sql"));
  await db.exec(migration("20260615000002_claim_owner.sql"));
  await db.exec(migration("20260615000003_purge_expired_tokens.sql"));
  await db.exec(migration("20260615000004_actions.sql"));
  await db.exec(migration("20260615000005_question_library_and_templates.sql"));
  await db.exec(migration("20260615000006_survey_i18n.sql"));
  await db.exec(migration("20260615000007_benchmarks.sql"));
  await db.exec(migration("20260616000000_benchmark_hardening.sql"));
  await db.exec(migration("20260616000001_responses_index.sql"));
  await db.exec(migration("20260616000002_survey_expiry_pref.sql"));
  await db.exec(migration("20260616000003_data_retention.sql"));
  await db.exec(migration("20260616000004_more_prefs.sql"));
  await db.exec(migration("20260616000005_send_schedule.sql"));
  await db.exec(migration("20260616000006_translations_check.sql"));
  await db.exec(migration("20260616000008_email_status.sql"));
  await db.exec(migration("20260616000009_rate_limit_cleanup.sql"));
  await db.exec(migration("20260616000010_plan_limits.sql"));
  await db.exec(migration("20260616000011_audit_helpers.sql"));
  await db.exec(migration("20260616000012_survey_closed_at.sql"));
  await db.exec(migration("20260616000013_soft_deletes.sql"));
}, 60000);

async function seedSnapshot(industry: string, band: string, score: number) {
  const userId = await newUser();
  await db.query(
    `insert into benchmark_snapshots (workspace_id, week_start, industry, headcount_band, avg_score)
     values ($1, current_date, $2, $3, $4)`,
    [userId, industry, band, score]
  );
  return userId;
}

async function getBenchmark(industry: string, band: string) {
  const r = await db.query<{ p25: number | null; p50: number | null; p75: number | null; cohort_size: number }>(
    `select * from get_benchmark($1, $2)`, [industry, band]
  );
  return r.rows[0];
}

async function newUser(): Promise<string> {
  return (await db.query<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`,
    [`u${Math.random()}@x.com`]
  )).rows[0].id;
}

async function claimOwner(userId: string): Promise<string> {
  return (await db.query<{ claim_owner: string }>(
    `select claim_owner($1) as claim_owner`, [userId]
  )).rows[0].claim_owner;
}

// ── helpers ──────────────────────────────────────────────────
async function seedSurvey(opts: { status?: string } = {}) {
  const status = opts.status ?? "active";
  // Inserting the auth user fires handle_new_user, which creates the profile row.
  const user = (await db.query<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`,
    [`u${Math.random()}@x.com`]
  )).rows[0];
  // Unlimited plan so the per-tier limits (tested separately) don't interfere
  // with fixtures that create multiple surveys/employees per workspace.
  await db.query(`update profiles set subscription_tier = 'enterprise' where id = $1`, [user.id]);
  const emp = (await db.query<{ id: string }>(
    `insert into employees (workspace_id, email) values ($1, $2) returning id`,
    [user.id, `e${Math.random()}@x.com`]
  )).rows[0];
  const survey = (await db.query<{ id: string }>(
    `insert into surveys (workspace_id, title, status) values ($1, 'T', $2) returning id`,
    [user.id, status]
  )).rows[0];
  return { userId: user.id, employeeId: emp.id, surveyId: survey.id };
}

async function makeToken(surveyId: string, employeeId: string, opts: { used?: boolean; expiresAt?: string } = {}) {
  const expires = opts.expiresAt ?? new Date(Date.now() + 7 * 864e5).toISOString();
  const row = (await db.query<{ token: string }>(
    `insert into survey_tokens (survey_id, employee_id, used, expires_at) values ($1, $2, $3, $4) returning token`,
    [surveyId, employeeId, opts.used ?? false, expires]
  )).rows[0];
  return row.token;
}

async function submit(token: string, answers: Record<string, unknown> = { q1: 5 }) {
  const r = await db.query<{ submit_survey_response: string }>(
    `select submit_survey_response($1, $2::jsonb) as submit_survey_response`,
    [token, JSON.stringify(answers)]
  );
  return r.rows[0].submit_survey_response;
}

async function responseCount(surveyId: string): Promise<number> {
  const r = await db.query<{ c: number }>(`select count(*)::int as c from responses where survey_id = $1`, [surveyId]);
  return r.rows[0].c;
}

// ── #1 atomic submit ─────────────────────────────────────────
describe("submit_survey_response (atomic)", () => {
  it("accepts a valid token, inserts one response, and marks the token used", async () => {
    const { surveyId, employeeId } = await seedSurvey();
    const token = await makeToken(surveyId, employeeId);

    expect(await submit(token)).toBe("ok");
    expect(await responseCount(surveyId)).toBe(1);

    const used = (await db.query<{ used: boolean }>(`select used from survey_tokens where token = $1`, [token])).rows[0].used;
    expect(used).toBe(true);
  });

  it("rejects a re-used token and does NOT insert a second response", async () => {
    const { surveyId, employeeId } = await seedSurvey();
    const token = await makeToken(surveyId, employeeId);

    expect(await submit(token)).toBe("ok");
    expect(await submit(token)).toBe("already_used");
    expect(await responseCount(surveyId)).toBe(1); // still only one
  });

  it("returns not_found for an unknown token", async () => {
    const random = "00000000-0000-0000-0000-000000000000";
    expect(await submit(random)).toBe("not_found");
  });

  it("returns expired for a past-expiry token and inserts nothing", async () => {
    const { surveyId, employeeId } = await seedSurvey();
    const token = await makeToken(surveyId, employeeId, { expiresAt: new Date(Date.now() - 1000).toISOString() });
    expect(await submit(token)).toBe("expired");
    expect(await responseCount(surveyId)).toBe(0);
  });

  it("returns closed when the survey is not active", async () => {
    const { surveyId, employeeId } = await seedSurvey({ status: "draft" });
    const token = await makeToken(surveyId, employeeId);
    expect(await submit(token)).toBe("closed");
    expect(await responseCount(surveyId)).toBe(0);
  });

  it("never stores employee linkage on the response", async () => {
    const { surveyId, employeeId } = await seedSurvey();
    const token = await makeToken(surveyId, employeeId);
    await submit(token);
    // responses table has no employee_id column at all — assert schema-level anonymity.
    const cols = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_name = 'responses'`
    );
    expect(cols.rows.map((c) => c.column_name)).not.toContain("employee_id");
  });
});

// ── #2 sliding-window rate limit ─────────────────────────────
describe("check_rate_limit_sliding", () => {
  async function check(ipHash: string, windowSeconds = 600, max = 5): Promise<number> {
    const r = await db.query<{ check_rate_limit_sliding: number }>(
      `select check_rate_limit_sliding($1, $2, $3) as check_rate_limit_sliding`,
      [ipHash, windowSeconds, max]
    );
    return r.rows[0].check_rate_limit_sliding;
  }

  it("allows up to max then blocks", async () => {
    const ip = "hash-a";
    for (let i = 1; i <= 5; i++) expect(await check(ip)).toBe(i); // 1..5 allowed
    expect(await check(ip)).toBe(6); // 6th over the limit
    expect(await check(ip)).toBe(6); // stays blocked, not incrementing stored events
  });

  it("keeps counts independent per IP", async () => {
    for (let i = 0; i < 6; i++) await check("hash-b");
    expect(await check("hash-c")).toBe(1); // unaffected
  });

  it("frees capacity as events age out of the window", async () => {
    const ip = "hash-d";
    // Use a 1-second window; exhaust it.
    for (let i = 1; i <= 5; i++) expect(await check(ip, 1)).toBe(i);
    expect(await check(ip, 1)).toBe(6); // blocked
    // Wait past the 1s window so all events age out.
    await new Promise((r) => setTimeout(r, 1100));
    expect(await check(ip, 1)).toBe(1); // capacity restored
  });
});

// ── #9 owner bootstrap ───────────────────────────────────────
describe("claim_owner", () => {
  // Ownership is global per-DB; reset before each case for determinism.
  beforeEach(async () => {
    await db.query(`update profiles set is_owner = false where is_owner = true`);
  });

  it("promotes the first caller to owner + enterprise", async () => {
    const u = await newUser();
    expect(await claimOwner(u)).toBe("ok");
    const row = (await db.query<{ is_owner: boolean; subscription_tier: string }>(
      `select is_owner, subscription_tier from profiles where id = $1`, [u]
    )).rows[0];
    expect(row.is_owner).toBe(true);
    expect(row.subscription_tier).toBe("enterprise");
  });

  it("is idempotent for the same owner", async () => {
    const u = await newUser();
    expect(await claimOwner(u)).toBe("ok");
    expect(await claimOwner(u)).toBe("already_owner");
  });

  it("refuses to promote a second user once an owner exists", async () => {
    const first = await newUser();
    expect(await claimOwner(first)).toBe("ok");
    const second = await newUser();
    expect(await claimOwner(second)).toBe("already_configured");
    const isOwner = (await db.query<{ is_owner: boolean }>(
      `select is_owner from profiles where id = $1`, [second]
    )).rows[0].is_owner;
    expect(isOwner).toBe(false);
  });
});

// ── #3 industry benchmarks ───────────────────────────────────
describe("get_benchmark", () => {
  it("hides percentiles until a cohort has at least 3 distinct orgs", async () => {
    await seedSnapshot("Solo", "1-50", 70);
    await seedSnapshot("Solo", "1-50", 80);
    const r = await getBenchmark("Solo", "1-50");
    expect(r.cohort_size).toBe(2);
    expect(r.p50).toBeNull(); // k-anonymity: not enough orgs
  });

  it("returns percentiles once the cohort reaches 3 orgs", async () => {
    await seedSnapshot("Tech", "51-200", 40);
    await seedSnapshot("Tech", "51-200", 60);
    await seedSnapshot("Tech", "51-200", 80);
    const r = await getBenchmark("Tech", "51-200");
    expect(r.cohort_size).toBe(3);
    expect(Number(r.p50)).toBe(60);
    expect(Number(r.p25)).toBeLessThanOrEqual(Number(r.p50));
    expect(Number(r.p75)).toBeGreaterThanOrEqual(Number(r.p50));
  });

  it("keeps cohorts separate by industry + size band", async () => {
    await seedSnapshot("Retail", "1000+", 90);
    const r = await getBenchmark("Retail", "1000+");
    expect(r.cohort_size).toBe(1);
    expect(r.p50).toBeNull();
  });
});

describe("count_completed_cycles", () => {
  it("counts distinct surveys that have at least one response", async () => {
    const { surveyId, userId } = await seedSurvey(); // seedSurvey inserts 0 responses
    // Survey 1: two responses → counts once.
    await db.query(`insert into responses (survey_id, answers) values ($1, '{"q":1}'::jsonb)`, [surveyId]);
    await db.query(`insert into responses (survey_id, answers) values ($1, '{"q":2}'::jsonb)`, [surveyId]);
    // Survey 2: one response.
    const s2 = (await db.query<{ id: string }>(`insert into surveys (workspace_id, title, status) values ($1,'S2','active') returning id`, [userId])).rows[0].id;
    await db.query(`insert into responses (survey_id, answers) values ($1, '{"q":3}'::jsonb)`, [s2]);
    // Survey 3: zero responses → does NOT count.
    await db.query(`insert into surveys (workspace_id, title, status) values ($1,'S3','active')`, [userId]);

    const r = await db.query<{ count_completed_cycles: number }>(
      `select count_completed_cycles($1) as count_completed_cycles`, [userId]
    );
    expect(r.rows[0].count_completed_cycles).toBe(2);
  });

  it("returns 0 for a workspace with no responses", async () => {
    const { userId } = await seedSurvey();
    const r = await db.query<{ count_completed_cycles: number }>(
      `select count_completed_cycles($1) as count_completed_cycles`, [userId]
    );
    expect(r.rows[0].count_completed_cycles).toBe(0);
  });
});

describe("survey_expiry_days preference", () => {
  it("defaults to 7 and rejects out-of-range values", async () => {
    const u = await newUser();
    const def = (await db.query<{ survey_expiry_days: number }>(
      `select survey_expiry_days from profiles where id = $1`, [u]
    )).rows[0].survey_expiry_days;
    expect(def).toBe(7);

    await db.query(`update profiles set survey_expiry_days = 14 where id = $1`, [u]);
    const updated = (await db.query<{ survey_expiry_days: number }>(
      `select survey_expiry_days from profiles where id = $1`, [u]
    )).rows[0].survey_expiry_days;
    expect(updated).toBe(14);

    let failed = false;
    try {
      await db.query(`update profiles set survey_expiry_days = 999 where id = $1`, [u]);
    } catch { failed = true; }
    expect(failed).toBe(true);
  });
});

describe("purge_old_responses (data retention)", () => {
  it("purges responses older than retention for opted-in workspaces, keeps the rest", async () => {
    // Workspace A: 90-day retention. One old response + one recent.
    const a = await seedSurvey();
    await db.query(`update profiles set data_retention_days = 90 where id = $1`, [a.userId]);
    await db.query(`insert into responses (survey_id, answers, submitted_at) values ($1, '{}'::jsonb, now() - interval '200 days')`, [a.surveyId]);
    await db.query(`insert into responses (survey_id, answers, submitted_at) values ($1, '{}'::jsonb, now() - interval '5 days')`, [a.surveyId]);

    // Workspace B: keep forever (null). Old response must survive.
    const b = await seedSurvey();
    await db.query(`insert into responses (survey_id, answers, submitted_at) values ($1, '{}'::jsonb, now() - interval '500 days')`, [b.surveyId]);

    const deleted = (await db.query<{ purge_old_responses: number }>(`select purge_old_responses() as purge_old_responses`)).rows[0].purge_old_responses;
    expect(deleted).toBe(1); // only A's 200-day-old response

    const aLeft = (await db.query<{ c: number }>(`select count(*)::int c from responses where survey_id = $1`, [a.surveyId])).rows[0].c;
    const bLeft = (await db.query<{ c: number }>(`select count(*)::int c from responses where survey_id = $1`, [b.surveyId])).rows[0].c;
    expect(aLeft).toBe(1); // recent one kept
    expect(bLeft).toBe(1); // keep-forever workspace untouched
  });

  it("rejects an invalid retention value", async () => {
    const u = await newUser();
    let failed = false;
    try { await db.query(`update profiles set data_retention_days = 45 where id = $1`, [u]); }
    catch { failed = true; }
    expect(failed).toBe(true);
  });
});

describe("write_audit_log", () => {
  it("appends an audit_logs row via the SECURITY DEFINER function", async () => {
    const u = await newUser();
    await db.query(
      `select write_audit_log($1, $2, 'plan.upgraded', 'profile', $3, '{"tier":"growth"}'::jsonb)`,
      [u, u, u]
    );
    const row = (await db.query<{ action: string; actor_id: string; workspace_id: string }>(
      `select action, actor_id, workspace_id from audit_logs where workspace_id = $1 order by created_at desc limit 1`,
      [u]
    )).rows[0];
    expect(row.action).toBe("plan.upgraded");
    expect(row.actor_id).toBe(u);
  });
});

describe("plan limit triggers", () => {
  it("blocks the 26th active employee on the free plan", async () => {
    const u = await newUser(); // default free tier
    for (let i = 0; i < 25; i++) {
      await db.query(`insert into employees (workspace_id, email) values ($1, $2)`, [u, `e${i}-${Math.random()}@x.com`]);
    }
    let failed = false;
    try { await db.query(`insert into employees (workspace_id, email) values ($1, $2)`, [u, `over@x.com`]); }
    catch (e) { failed = true; expect(String(e)).toMatch(/Free plan limit: 25 employees/); }
    expect(failed).toBe(true);
  });

  it("allows beyond the free limit on a higher tier", async () => {
    const u = await newUser();
    await db.query(`update profiles set subscription_tier = 'starter' where id = $1`, [u]);
    for (let i = 0; i < 30; i++) {
      await db.query(`insert into employees (workspace_id, email) values ($1, $2)`, [u, `e${i}-${Math.random()}@x.com`]);
    }
    const c = (await db.query<{ c: number }>(`select count(*)::int c from employees where workspace_id = $1`, [u])).rows[0].c;
    expect(c).toBe(30);
  });

  it("blocks a 2nd active survey on the free plan", async () => {
    const u = await newUser();
    await db.query(`insert into surveys (workspace_id, title, status) values ($1, 'A', 'active')`, [u]);
    let failed = false;
    try { await db.query(`insert into surveys (workspace_id, title, status) values ($1, 'B', 'active')`, [u]); }
    catch (e) { failed = true; expect(String(e)).toMatch(/Free plan allows 1 active survey/); }
    expect(failed).toBe(true);
    // Drafts are fine.
    await db.query(`insert into surveys (workspace_id, title, status) values ($1, 'C', 'draft')`, [u]);
  });
});

describe("survey_tokens.email_status", () => {
  it("defaults to pending and accepts the three valid states", async () => {
    const { surveyId, employeeId } = await seedSurvey();
    const token = await makeToken(surveyId, employeeId);
    const def = (await db.query<{ email_status: string }>(`select email_status from survey_tokens where token = $1`, [token])).rows[0].email_status;
    expect(def).toBe("pending");

    await db.query(`update survey_tokens set email_status = 'sent' where token = $1`, [token]);
    await db.query(`update survey_tokens set email_status = 'failed', email_error = 'boom' where token = $1`, [token]);
    const row = (await db.query<{ email_status: string; email_error: string }>(`select email_status, email_error from survey_tokens where token = $1`, [token])).rows[0];
    expect(row.email_status).toBe("failed");
    expect(row.email_error).toBe("boom");

    let failed = false;
    try { await db.query(`update survey_tokens set email_status = 'bogus' where token = $1`, [token]); }
    catch { failed = true; }
    expect(failed).toBe(true);
  });
});

describe("surveys.translations check constraint", () => {
  it("accepts a JSON object but rejects arrays/scalars", async () => {
    const { surveyId } = await seedSurvey();
    await db.query(`update surveys set translations = '{"questions":{}}'::jsonb where id = $1`, [surveyId]);
    let arrFailed = false;
    try { await db.query(`update surveys set translations = '[]'::jsonb where id = $1`, [surveyId]); }
    catch { arrFailed = true; }
    expect(arrFailed).toBe(true);

    let scalarFailed = false;
    try { await db.query(`update surveys set translations = '5'::jsonb where id = $1`, [surveyId]); }
    catch { scalarFailed = true; }
    expect(scalarFailed).toBe(true);
  });
});

// ── token cleanup ────────────────────────────────────────────
describe("purge_expired_tokens", () => {
  it("deletes used and expired tokens but keeps live ones", async () => {
    const { surveyId, employeeId, userId } = await seedSurvey();
    // Two more employees so each token has a distinct (survey_id, employee_id).
    const emp2 = (await db.query<{ id: string }>(`insert into employees (workspace_id, email) values ($1,$2) returning id`, [userId, `e${Math.random()}@x.com`])).rows[0].id;
    const emp3 = (await db.query<{ id: string }>(`insert into employees (workspace_id, email) values ($1,$2) returning id`, [userId, `e${Math.random()}@x.com`])).rows[0].id;

    // live (unused, future expiry) — should survive
    await makeToken(surveyId, employeeId, { used: false, expiresAt: new Date(Date.now() + 864e5).toISOString() });
    // used — should be deleted
    await makeToken(surveyId, emp2, { used: true, expiresAt: new Date(Date.now() + 864e5).toISOString() });
    // expired — should be deleted
    await makeToken(surveyId, emp3, { used: false, expiresAt: new Date(Date.now() - 1000).toISOString() });

    const before = (await db.query<{ c: number }>(`select count(*)::int c from survey_tokens where survey_id = $1`, [surveyId])).rows[0].c;
    expect(before).toBe(3);

    const deleted = (await db.query<{ purge_expired_tokens: number }>(`select purge_expired_tokens() as purge_expired_tokens`)).rows[0].purge_expired_tokens;
    expect(deleted).toBeGreaterThanOrEqual(2);

    const remaining = (await db.query<{ c: number }>(`select count(*)::int c from survey_tokens where survey_id = $1`, [surveyId])).rows[0].c;
    expect(remaining).toBe(1); // only the live token survives
  });
});

// ── soft deletes ─────────────────────────────────────────────
describe("soft deletes", () => {
  it("purge_deleted_surveys removes rows soft-deleted >30 days ago but keeps recent ones", async () => {
    const old = await seedSurvey();
    const recent = await seedSurvey();
    // old: deleted 40 days ago → eligible for purge
    await db.query(`update surveys set deleted_at = now() - interval '40 days' where id = $1`, [old.surveyId]);
    // recent: deleted 2 days ago → still restorable, must survive
    await db.query(`update surveys set deleted_at = now() - interval '2 days' where id = $1`, [recent.surveyId]);

    await db.query(`select purge_deleted_surveys()`);

    const oldGone = (await db.query<{ c: number }>(`select count(*)::int c from surveys where id = $1`, [old.surveyId])).rows[0].c;
    const recentKept = (await db.query<{ c: number }>(`select count(*)::int c from surveys where id = $1`, [recent.surveyId])).rows[0].c;
    expect(oldGone).toBe(0);
    expect(recentKept).toBe(1);
  });

  it("the survey-limit trigger does not count soft-deleted surveys", async () => {
    // A free-tier workspace (limit 1 active survey).
    const user = (await db.query<{ id: string }>(`insert into auth.users (email) values ($1) returning id`, [`u${Math.random()}@x.com`])).rows[0];
    // First active survey — allowed.
    const first = (await db.query<{ id: string }>(`insert into surveys (workspace_id, title, status) values ($1,'A','active') returning id`, [user.id])).rows[0].id;
    // Soft-delete it, freeing the slot.
    await db.query(`update surveys set deleted_at = now() where id = $1`, [first]);
    // A new active survey must now be allowed (the deleted one doesn't count).
    let ok = true;
    try {
      await db.query(`insert into surveys (workspace_id, title, status) values ($1,'B','active')`, [user.id]);
    } catch {
      ok = false;
    }
    expect(ok).toBe(true);
  });
});
