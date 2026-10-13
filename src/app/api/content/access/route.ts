import {cookies} from "next/headers";
import {configured, CONTENT_COOKIE, CONTENT_SESSION_SECONDS, createSession, pinMatches} from "@/features/content/security";
import {requireAdmin} from "@/lib/auth";
import {body, failure, HttpError, json, rateLimit} from "@/lib/security/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdmin("content", true);
    const input = await body(request, 4096);
    const jar = await cookies();
    if (input.action === "logout") {jar.delete(CONTENT_COOKIE); return json({ok: true});}
    await rateLimit(request, "content-unlock", 5, 600);
    if (input.action !== "login" || typeof input.pin !== "string" || !configured() || !pinMatches(input.pin)) throw new HttpError(401, "Invalid content PIN.");
    jar.set(CONTENT_COOKIE, createSession(), {httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: CONTENT_SESSION_SECONDS});
    return json({ok: true});
  } catch (error) {return failure(error);}
}