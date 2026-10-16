import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {body, failure, json} from "@/lib/security/http";
export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  try {
    const user = await requireAdmin("feedback", true);
    const {message} = z.object({message: z.string().trim().min(1).max(1500)}).parse(await body(request, 10000));
    const {id} = await params;
    await db.$transaction(async tx => {
      await tx.webConversation.update({where: {id}, data: {updatedAt: new Date(), messages: {create: {sender: "admin", text: message}}}});
      await tx.auditLog.create({data: {userId: user.id, action: "reply", resource: "web-message", recordId: id}});
    });
    return json({sent: true});
  } catch (error) {return failure(error);}
}
