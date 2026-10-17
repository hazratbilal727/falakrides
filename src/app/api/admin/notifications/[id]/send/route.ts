import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {deliverNotification} from "@/features/admin/notifications";
import {failure, json, sameOrigin, rateLimit} from "@/lib/security/http";
export async function POST(request: Request, context: {params: Promise<{id: string}>}) {
  try {sameOrigin(request); const user = await requireAdmin("notifications", true); await rateLimit(request, "notification-send", 30); const {id} = await context.params; const record = await deliverNotification(id); await db.auditLog.create({data: {userId: user.id, action: "send", resource: "notifications", recordId: id}}); return json({status: record.status});} catch (error) {return failure(error);}
}
