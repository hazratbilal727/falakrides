import {randomBytes} from "node:crypto";
import {cookies} from "next/headers";
import {z} from "zod";
import {db} from "@/lib/db";
import {body, digest, failure, HttpError, json, rateLimit} from "@/lib/security/http";

const cookieName = "falak-web-chat";
const messageFields = {select: {id: true, sender: true, text: true, createdAt: true}, orderBy: {createdAt: "asc" as const}};
export async function GET() {
  try {
    const token = (await cookies()).get(cookieName)?.value;
    const conversation = token ? await db.webConversation.findUnique({where: {tokenHash: digest(token)}, select: {name: true, blocked: true, messages: messageFields}}) : null;
    return json({conversation});
  } catch (error) {return failure(error);}
}
export async function POST(request: Request) {
  try {
    const input = z.object({name: z.string().trim().min(1, "Enter your name.").max(80).optional(), message: z.string().trim().min(1, "Enter your message.").max(1500)}).parse(await body(request, 10000));
    await rateLimit(request, "web-chat", 20, 600);
    const jar = await cookies();
    const token = jar.get(cookieName)?.value || randomBytes(32).toString("hex");
    const existing = await db.webConversation.findUnique({where: {tokenHash: digest(token)}, select: {name: true, blocked: true}});
    if (existing?.blocked) throw new HttpError(403, "Messaging is unavailable for this conversation.");
    const name = existing?.name || input.name;
    if (!name) throw new HttpError(400, "Enter your name.");
    const conversation = await db.webConversation.upsert({
      where: {tokenHash: digest(token)},
      create: {tokenHash: digest(token), name, messages: {create: {sender: "visitor", text: input.message}}},
      update: {updatedAt: new Date(), messages: {create: {sender: "visitor", text: input.message}}},
      select: {name: true, blocked: true, messages: messageFields},
    });
    jar.set(cookieName, token, {httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90});
    return json({conversation}, 201);
  } catch (error) {return failure(error);}
}

export async function PATCH(request: Request) {
  try {
    const {name} = z.object({name: z.string().trim().min(1, "Enter your name.").max(80)}).parse(await body(request, 1000));
    await rateLimit(request, "web-chat-name", 10, 600);
    const jar = await cookies();
    const token = jar.get(cookieName)?.value || randomBytes(32).toString("hex");
    const existing = await db.webConversation.findUnique({where: {tokenHash: digest(token)}, select: {blocked: true}});
    if (existing?.blocked) throw new HttpError(403, "Messaging is unavailable for this conversation.");
    const conversation = await db.webConversation.upsert({where: {tokenHash: digest(token)}, create: {tokenHash: digest(token), name}, update: {}, select: {name: true, blocked: true, messages: messageFields}});
    jar.set(cookieName, token, {httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 90});
    return json({conversation});
  } catch (error) {return failure(error);}
}
