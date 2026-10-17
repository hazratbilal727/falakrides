import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {body, failure, json} from "@/lib/security/http";
export async function PATCH(request: Request) {
  try {
    const user = await requireAdmin();
    const input = z.object({ids: z.array(z.string().max(150)).max(1000), action: z.enum(["read", "dismiss"])}).parse(await body(request));
    await db.$transaction(input.ids.map(noticeId => db.noticeState.upsert({where: {userId_noticeId: {userId: user.id, noticeId}}, create: {userId: user.id, noticeId, read: true, dismissed: input.action === "dismiss"}, update: {read: true, ...(input.action === "dismiss" ? {dismissed: true} : {})}})));
    return json({ok: true});
  } catch (error) {return failure(error);}
}
