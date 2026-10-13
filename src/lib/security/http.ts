import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import {ZodError} from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {super(message);}
}
export const json = (value: unknown, status = 200) => Response.json(value, {status, headers: {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}});
export function failure(error: unknown) {
  if (error instanceof HttpError) return json({error: error.message}, error.status);
  if (error instanceof ZodError) return json({error: error.issues[0]?.message || "Check the submitted fields."}, 400);
  const code = error && typeof error === "object" && "code" in error ? error.code : "";
  if (code === "P2002") return json({error: "A record with those details already exists."}, 409);
  if (code === "P2003") return json({error: "This record is still used by another record and cannot be removed."}, 409);
  if (code === "P2025") return json({error: "Record not found, or someone else updated it. Refresh and try again."}, 409);
  console.error("Backend request failed:", error instanceof Error ? error.name : "UnknownError");
  return json({error: "The request could not be completed. Please try again."}, 500);
}
export function sameOrigin(request: Request) {
  const allowed = process.env.SITE_URL || process.env.BETTER_AUTH_URL || new URL(request.url).origin;
  if (request.headers.get("origin") !== new URL(allowed).origin) throw new HttpError(403, "Request origin is not allowed.");
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403, "Cross-site requests are not allowed.");
}
export async function body(request: Request, limit = 1024 * 1024) {
  sameOrigin(request);
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new HttpError(415, "JSON is required.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body is required.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) {const chunk = await reader.read(); if (chunk.done) break; length += chunk.value.length; if (length > limit) {await reader.cancel(); throw new HttpError(413, "The request is too large.");} chunks.push(chunk.value);}
  try {return JSON.parse(Buffer.concat(chunks).toString("utf8"));} catch {throw new HttpError(400, "Invalid JSON.");}
}
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function rateLimit(request: Request, purpose: string, max = 30, seconds = 60) {
  // Trust proxy IP headers only when explicitly configured behind a trusted proxy.
  const ip = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local";
  const key = `${purpose}:${digest(ip)}:${Math.floor(Date.now() / (seconds * 1000))}`;
  const entry = await db.rateLimit.upsert({where: {key}, create: {key, count: 1, lastRequest: BigInt(Date.now())}, update: {count: {increment: 1}, lastRequest: BigInt(Date.now())}});
  if (entry.count > max) throw new HttpError(429, "Too many requests. Please wait and try again.");
}
