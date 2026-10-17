import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {failure, json} from "@/lib/security/http";
export async function GET() {
  try {
    await requireAdmin("feedback");
    const conversations = await db.webConversation.findMany({orderBy: {updatedAt: "desc"}, select: {id: true, name: true, blocked: true, updatedAt: true, messages: {orderBy: {createdAt: "asc"}, select: {id: true, sender: true, text: true, createdAt: true}}}});
    return json({conversations});
  } catch (error) {return failure(error);}
}
