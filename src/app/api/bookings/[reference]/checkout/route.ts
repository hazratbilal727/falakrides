import {visitor} from "@/lib/auth/visitor";
import {checkout} from "@/features/bookings/payments";
import {failure, HttpError, json, rateLimit, sameOrigin} from "@/lib/security/http";
export async function POST(request: Request, context: {params: Promise<{reference: string}>}) {
  try {sameOrigin(request); await rateLimit(request, "checkout", 10, 600); const customer = await visitor(); if (!customer) throw new HttpError(401, "Open this booking on the device used to request it."); return json(await checkout((await context.params).reference, customer.id, new URL(request.url).origin));} catch (error) {return failure(error);}
}
