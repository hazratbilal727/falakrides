import {requireAdmin} from "@/lib/auth";
import {refundPayment} from "@/features/bookings/payments";
import {body, failure, json, rateLimit} from "@/lib/security/http";
export async function POST(request: Request, context: {params: Promise<{id: string}>}) {
  try {const user = await requireAdmin("payments", true); const input = await body(request, 4096); await rateLimit(request, "refund", 10, 600); await refundPayment((await context.params).id, Number(input.version), user.id); return json({ok: true});} catch (error) {return failure(error);}
}
