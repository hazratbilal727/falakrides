import {createHash, createHmac, timingSafeEqual, randomUUID} from "node:crypto";
const hash = (value: string) => createHash("sha256").update(value).digest();
export const CONTENT_COOKIE = "falak-content-session";
export const CONTENT_SESSION_SECONDS = 15 * 60;
export const configured = () => /^\d{5}$/.test(process.env.CONTENT_ADMIN_PIN || "") && (process.env.CONTENT_SESSION_SECRET?.length || 0) >= 32;
export const pinMatches = (value: string) => configured() && /^\d{5}$/.test(value) && timingSafeEqual(hash(value), hash(process.env.CONTENT_ADMIN_PIN!));
// Bind signatures to the PIN and a new purpose, invalidating legacy password sessions.
const sign = (value: string) => createHmac("sha256", process.env.CONTENT_SESSION_SECRET!).update(`content-pin-v1:${process.env.CONTENT_ADMIN_PIN}:${value}`).digest("hex");
export function createSession() { const value = `${Date.now() + CONTENT_SESSION_SECONDS * 1000}.${randomUUID()}`; return `${value}.${sign(value)}`; }
export function validSession(value: string | undefined) {
  if (!configured() || !value) return false;
  const [expiry, nonce, signature, extra] = value.split(".");
  if (extra || !nonce || !signature || !/^\d+$/.test(expiry) || Number(expiry) <= Date.now() || Number(expiry) > Date.now() + CONTENT_SESSION_SECONDS * 1000) return false;
  return timingSafeEqual(hash(signature), hash(sign(`${expiry}.${nonce}`)));
}
// Single-instance limits. Use a shared limiter before deploying multiple servers.
const attempts = new Map<string, {count: number; reset: number}>();
export function allowRequest(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  for (const [id, item] of attempts) if (item.reset <= now) attempts.delete(id);
  const item = attempts.get(key) || {count: 0, reset: now + windowMs};
  item.count += 1; attempts.set(key, item);
  return item.count <= limit;
}
