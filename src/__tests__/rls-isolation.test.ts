// @vitest-environment node
//
// Cross-tenant RLS isolation test — the core security guarantee of the app.
// Runs against real Postgres (PGlite). RLS is bypassed for the superuser/owner,
// so we switch to a non-superuser `authenticated` role (like Supabase does) and
// drive auth.uid() from a session GUC to impersonate each tenant.
import { describe, it, expect, beforeAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const mig = (n: string) => readFileSync(join(MIGRATIONS_DIR, n), "utf8");

let db: PGlite;
let orgA: { userId: string; surveyId: string };
let orgB: { userId: string; surveyId: string };

async function seedOrg() {
  const user = (await db.query<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`,
    [`u${Math.random()}@x.com`]
  )).rows[0];
  const survey = (await db.query<{ id: string }>(
    `insert into surveys (workspace_id, title, status) values ($1, 'S', 'active') returning id`,
    [user.id]
  )).rows[0];
  await db.query(`insert into employees (workspace_id, email) values ($1, $2)`, [user.id, `e${Math.random()}@x.com`]);
  await db.query(`insert into responses (survey_id, answers) values ($1, '{"q":5}'::jsonb)`, [survey.id]);
  await db.query(`insert into actions (workspace_id, title, status) values ($1, 'Do a thing', 'planned')`, [user.id]);
  return { userId: user.id, surveyId: survey.id };
}

/** Run a query as a given tenant under RLS (non-superuser `authenticated` role).
 *  Uses session-scoped `set` (not `set local`) so the GUC survives across the
 *  separate auto-committed statements PGlite issues. */
async function asUser<T>(uid: string, sql: string): Promise<T[]> {
  await db.exec(`set role authenticated; set "test.uid" = '${uid}';`);
  try {
    return (await db.query<T>(sql)).rows;
  } finally {
    await db.exec(`set "test.uid" = ''; reset role;`);
  }
}

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(`
    create schema if not exists auth;
    create table if not exists auth.users (
      id uuid primary key default gen_random_uuid(),
      email text,
      raw_user_meta_data jsonb
    );
    -- auth.uid() reads the impersonated tenant id from a session GUC.
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.uid', true), '')::uuid
    $$;
  `);

  await db.exec(mig("20260101000000_initial_schema.sql"));
  await db.exec(mig("20260101000001_rate_limiting.sql"));
  await db.exec(mig("20260615000000_atomic_submit_response.sql"));
  await db.exec(mig("20260615000001_sliding_window_rate_limit.sql"));
  await db.exec(mig("20260615000004_actions.sql"));

  // A real Supabase-style non-superuser role that RLS actually applies to.
  await db.exec(`
    create role authenticated nologin;
    grant usage on schema public to authenticated;
    grant select, insert, update, delete on all tables in schema public to authenticated;
  `);

  // Seed two separate tenants as superuser (RLS bypassed for setup).
  orgA = await seedOrg();
  orgB = await seedOrg();
}, 60000);

describe("RLS cross-tenant isolation", () => {
  it("a tenant sees only their own surveys", async () => {
    const aRows = await asUser<{ id: string }>(orgA.userId, `select id from surveys`);
    expect(aRows.map((r) => r.id)).toEqual([orgA.surveyId]);
    expect(aRows.map((r) => r.id)).not.toContain(orgB.surveyId);
  });

  it("a tenant cannot read another tenant's survey by id", async () => {
    const rows = await asUser(orgA.userId, `select id from surveys where id = '${orgB.surveyId}'`);
    expect(rows).toHaveLength(0); // RLS hides it entirely
  });

  it("a tenant sees only their own employees", async () => {
    const aRows = await asUser(orgA.userId, `select id from employees`);
    const bRows = await asUser(orgB.userId, `select id from employees`);
    expect(aRows).toHaveLength(1);
    expect(bRows).toHaveLength(1);
    expect(aRows).not.toEqual(bRows);
  });

  it("a tenant sees only responses for their own surveys", async () => {
    const aRows = await asUser(orgA.userId, `select id from responses`);
    const bRows = await asUser(orgB.userId, `select id from responses`);
    expect(aRows).toHaveLength(1);
    expect(bRows).toHaveLength(1);
  });

  it("a tenant cannot UPDATE another tenant's survey", async () => {
    await asUser(orgA.userId, `update surveys set title = 'hacked' where id = '${orgB.surveyId}'`);
    // Verify as superuser that B's survey is untouched.
    const title = (await db.query<{ title: string }>(`select title from surveys where id = $1`, [orgB.surveyId])).rows[0].title;
    expect(title).toBe("S");
  });

  it("a tenant cannot DELETE another tenant's employees", async () => {
    const before = (await db.query<{ c: number }>(`select count(*)::int c from employees where workspace_id = $1`, [orgB.userId])).rows[0].c;
    await asUser(orgA.userId, `delete from employees where workspace_id = '${orgB.userId}'`);
    const after = (await db.query<{ c: number }>(`select count(*)::int c from employees where workspace_id = $1`, [orgB.userId])).rows[0].c;
    expect(after).toBe(before);
  });

  it("a tenant sees only their own actions", async () => {
    const aRows = await asUser(orgA.userId, `select id from actions`);
    const bRows = await asUser(orgB.userId, `select id from actions`);
    expect(aRows).toHaveLength(1);
    expect(bRows).toHaveLength(1);
    expect(aRows).not.toEqual(bRows);
  });

  it("a tenant cannot insert an action for another tenant (RLS WITH CHECK)", async () => {
    // Attempt to insert a row owned by org B while acting as org A — RLS rejects it.
    await db.exec(`set role authenticated; set "test.uid" = '${orgA.userId}';`);
    let failed = false;
    try {
      await db.query(`insert into actions (workspace_id, title) values ('${orgB.userId}', 'evil')`);
    } catch {
      failed = true;
    } finally {
      await db.exec(`set "test.uid" = ''; reset role;`);
    }
    expect(failed).toBe(true);
    // Confirm B has no injected row.
    const count = (await db.query<{ c: number }>(`select count(*)::int c from actions where workspace_id = $1`, [orgB.userId])).rows[0].c;
    expect(count).toBe(1);
  });

  it("an anonymous user (no auth.uid) sees no surveys or responses", async () => {
    await db.exec(`set role authenticated; set "test.uid" = '';`);
    try {
      const surveys = (await db.query(`select id from surveys`)).rows;
      const responses = (await db.query(`select id from responses`)).rows;
      const tokens = (await db.query(`select token from survey_tokens`)).rows;
      expect(surveys).toHaveLength(0);
      expect(responses).toHaveLength(0);
      expect(tokens).toHaveLength(0); // the old `auth.uid() is null` leak is gone
    } finally {
      await db.exec(`reset role;`);
    }
  });
});
