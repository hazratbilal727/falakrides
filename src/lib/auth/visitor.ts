import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {db} from "@/lib/db";
import {digest} from "@/lib/security/http";

const COOKIE = "falak-visitor";
export async function visitor(create = false) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    const session = await db.visitorSession.findUnique({where: {tokenHash: digest(token)}, include: {customer: true}});
    if (session && session.expiresAt > new Date()) return session.customer;
  }
  if (!create) return null;
  const nextToken = randomBytes(32).toString("hex");
  const customer = await db.customer.create({data: {name: "", sessions: {create: {tokenHash: digest(nextToken), expiresAt: new Date(Date.now() + 90 * 86400000)}}}});
  jar.set(COOKIE, nextToken, {httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 90 * 86400});
  return customer;
}
