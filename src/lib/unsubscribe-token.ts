import { createHmac, timingSafeEqual } from "node:crypto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getSecret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET ?? null;
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function createUnsubscribeToken(workspaceId: string, employeeId: string): string {
  const secret = getSecret();
  if (!secret) throw new Error("UNSUBSCRIBE_SECRET or CRON_SECRET is required to create unsubscribe links");

  const body = Buffer.from(`${workspaceId}:${employeeId}`, "utf8").toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifyUnsubscribeToken(token: string): { workspaceId: string; employeeId: string } | null {
  const secret = getSecret();
  if (!secret) return null;

  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = sign(body, secret);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const decoded = Buffer.from(body, "base64url").toString("utf8");
    const [workspaceId, employeeId, extraPart] = decoded.split(":");
    if (extraPart !== undefined || !UUID_RE.test(workspaceId) || !UUID_RE.test(employeeId)) return null;
    return { workspaceId, employeeId };
  } catch {
    return null;
  }
}
