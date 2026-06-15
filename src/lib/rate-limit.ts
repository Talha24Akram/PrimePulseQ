// ============================================================
// Shared DB-backed sliding-window rate limiting (server-only).
// Backed by the check_rate_limit_sliding() Postgres function
// (migration 20260615000001). Used by public + authed write routes.
// ============================================================

// Minimal shape we need from a Supabase client (service-role) — avoids `any`.
// The Supabase rpc() builder is a thenable (PromiseLike), not a full Promise.
export interface RpcClient {
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown }>;
}

/** Extract the best-effort client IP from request headers. */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Hash the IP so raw addresses are never stored. Prefers RATE_LIMIT_SALT,
 *  falls back to CRON_SECRET for backward compatibility. */
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.CRON_SECRET ?? "salt";
  const data = new TextEncoder().encode(ip + salt);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Returns true if the request is within the limit. Fails open (returns true)
 *  if the rate-limit call errors — better than blocking all traffic. */
export async function rateLimitOk(
  supabase: RpcClient,
  ip: string,
  opts: { max: number; windowSeconds: number }
): Promise<boolean> {
  try {
    const ipHash = await hashIp(ip);
    const { data } = await supabase.rpc("check_rate_limit_sliding", {
      p_ip_hash: ipHash,
      p_window_seconds: opts.windowSeconds,
      p_max: opts.max,
    });
    const count = typeof data === "number" ? data : Number(data);
    return count <= opts.max;
  } catch {
    return true;
  }
}
