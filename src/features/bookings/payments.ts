import {createHmac, timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
import {HttpError} from "@/lib/security/http";

async function stripe(path: string, fields: URLSearchParams, key: string) {
  if (!process.env.STRIPE_SECRET_KEY) throw new HttpError(503, "Configure the payment provider before processing card payments.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {method: "POST", headers: {Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": key}, body: fields, signal: AbortSignal.timeout(15000)});
  const result = await response.json();
  if (!response.ok) throw new HttpError(502, "The payment provider could not complete this request. No payment status was assumed.");
  return result;
}
export async function checkout(reference: string, customerId: string, origin: string) {
  if (!process.env.STRIPE_SECRET_KEY) throw new HttpError(503, "Online card payments are not configured.");
  const booking = await db.booking.findFirst({where: {reference, customerId}});
  if (!booking) throw new HttpError(404, "Booking not found.");
  if (booking.status !== "Confirmed" || !booking.fare || booking.fare <= 0) throw new HttpError(409, "The team must confirm your booking and fare before payment.");
  const payment = await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment:${booking.id}`}))::text`;
    const paid = await tx.payment.findFirst({where: {bookingId: booking.id, status: {in: ["Paid", "Refunding", "Refund pending"]}}});
    if (paid) throw new HttpError(409, "This booking already has a recorded payment.");
    const pending = await tx.payment.findFirst({where: {bookingId: booking.id, method: "Card", status: "Pending"}});
    if (pending && pending.amount !== booking.fare) throw new HttpError(409, "An earlier payment request has a different fare. Ask support to review it.");
    return pending || tx.payment.create({data: {bookingId: booking.id, amount: booking.fare!, method: "Card", status: "Pending"}});
  });
  const result = await stripe("checkout/sessions", new URLSearchParams({mode: "payment", success_url: `${origin}/my-bookings?payment=received`, cancel_url: `${origin}/my-bookings`, "line_items[0][price_data][currency]": "sar", "line_items[0][price_data][unit_amount]": String(payment.amount), "line_items[0][price_data][product_data][name]": `Falak Rides ${reference}`, "line_items[0][quantity]": "1", "metadata[paymentId]": payment.id, "payment_intent_data[metadata][paymentId]": payment.id}), `checkout-${payment.id}`);
  await db.payment.update({where: {id: payment.id}, data: {providerId: result.id, version: {increment: 1}}});
  return {url: result.url};
}
export async function refundPayment(id: string, version: number, userId: string) {
  const payment = await db.payment.findUnique({where: {id}});
  if (!payment) throw new HttpError(404, "Payment not found.");
  if (payment.version !== version || !["Paid", "Refunding"].includes(payment.status)) throw new HttpError(409, "Refresh this payment before refunding it.");
  if (payment.method !== "Card") throw new HttpError(400, "Use Record refund after returning a cash or bank-transfer payment.");
  if (!payment.providerId?.startsWith("pi_") || !process.env.STRIPE_SECRET_KEY) throw new HttpError(503, "A verified card transaction and configured payment provider are required.");
  const claimed = await db.payment.updateMany({where: {id, version, status: {in: ["Paid", "Refunding"]}}, data: {status: "Refunding", version: {increment: 1}}});
  if (!claimed.count) throw new HttpError(409, "This payment is already being updated.");
  try {
    const refund = await stripe("refunds", new URLSearchParams({payment_intent: payment.providerId, amount: String(payment.amount), "metadata[paymentId]": id}), `refund-${id}`);
    await db.$transaction([db.payment.update({where: {id}, data: {status: refund.status === "succeeded" ? "Refunded" : "Refund pending", version: {increment: 1}}}), db.auditLog.create({data: {userId, action: "refund", resource: "payments", recordId: id}})]);
  } catch (error) {
    if (error instanceof HttpError) await db.payment.updateMany({where: {id, status: "Refunding"}, data: {status: "Paid", version: {increment: 1}}});
    // A timeout can occur after the provider accepted the refund. Retain the
    // in-flight state; reconcile using signed webhooks instead of double-refunding.
    throw error;
  }
}
type StripeEvent = {type: string; data: {object: {id: string; payment_intent?: string; metadata?: {paymentId?: string}; payment_status?: string; amount_total?: number; amount?: number; currency?: string; status?: string}}};
export async function stripeWebhook(raw: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, "Payment webhooks are not configured.");
  const timestamp = signature?.split(",").find(item => item.startsWith("t="))?.slice(2);
  const signatures = signature?.split(",").filter(item => item.startsWith("v1=")).map(item => item.slice(3)) || [];
  if (!timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new HttpError(400, "Invalid webhook signature.");
  const expected = createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest();
  if (!signatures.some(value => /^[a-f0-9]{64}$/.test(value) && timingSafeEqual(Buffer.from(value, "hex"), expected))) throw new HttpError(400, "Invalid webhook signature.");
  const event = JSON.parse(raw) as StripeEvent;
  const object = event.data.object;
  if (event.type === "checkout.session.completed" && object.payment_status === "paid") {
    const paymentId = object.metadata?.paymentId;
    if (!paymentId) throw new HttpError(400, "Payment reference is missing.");
    const payment = await db.payment.findUnique({where: {id: paymentId}});
    if (!payment || payment.amount !== object.amount_total || object.currency !== "sar" || !object.payment_intent) throw new HttpError(400, "Payment amount, currency or reference does not match.");
    if (payment.status !== "Pending" && payment.providerId === object.payment_intent) return;
    if (payment.providerId !== object.id) throw new HttpError(400, "Payment reference does not match.");
    await db.payment.updateMany({where: {id: paymentId, status: "Pending"}, data: {status: "Paid", providerId: object.payment_intent, paidAt: new Date(), version: {increment: 1}}});
  }
  if (["refund.created", "refund.updated"].includes(event.type) && object.status === "succeeded" && object.metadata?.paymentId && object.payment_intent && typeof object.amount === "number") await db.payment.updateMany({where: {id: object.metadata.paymentId, amount: object.amount, providerId: object.payment_intent, status: {in: ["Paid", "Refunding", "Refund pending"]}}, data: {status: "Refunded", version: {increment: 1}}});
  if (event.type === "checkout.session.expired" && object.metadata?.paymentId) await db.payment.updateMany({where: {id: object.metadata.paymentId, providerId: object.id, status: "Pending"}, data: {status: "Failed", version: {increment: 1}}});
}
