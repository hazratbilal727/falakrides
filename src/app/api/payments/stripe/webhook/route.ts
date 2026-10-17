import {stripeWebhook} from "@/features/bookings/payments";
import {failure, HttpError, json} from "@/lib/security/http";
export async function POST(request: Request) {
  try {
    const reader = request.body?.getReader(); if (!reader) throw new HttpError(400, "Webhook body required.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > 1024 * 1024) {await reader.cancel(); throw new HttpError(413, "Webhook is too large.");} chunks.push(item.value);}
    await stripeWebhook(Buffer.concat(chunks).toString("utf8"), request.headers.get("stripe-signature")); return json({received: true});
  } catch (error) {return failure(error);}
}
