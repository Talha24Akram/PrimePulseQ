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
