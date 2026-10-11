import crypto from "node:crypto";
const salt = crypto.randomBytes(32);
const attempts = new Map<string, { count: number; resetAt: number }>();
/** Local abuse protection. A distributed limiter is needed for a fleet-wide cap. */
export function isRateLimited(namespace: string, ip: string, limit = 10): boolean {
  const now = Date.now();
  for (const [key, value] of attempts) if (now > value.resetAt) attempts.delete(key);
  const key = crypto.createHmac("sha256", salt).update(`${namespace}:${ip}`).digest("hex");
  const entry = attempts.get(key);
  if (!entry) {
    if (attempts.size >= 10000) return true;
    attempts.set(key, { count: 1, resetAt: now + 60000 }); return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

