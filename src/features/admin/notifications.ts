import {db} from "@/lib/db";
import {HttpError} from "@/lib/security/http";

export function notificationConfigured(channel: string) {
  return channel === "Email" ? !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) : !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (channel === "WhatsApp" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM));
}
export async function deliverNotification(id: string) {
  const record = await db.notification.findUniqueOrThrow({where: {id}});
  if (!notificationConfigured(record.channel)) throw new HttpError(503, `Configure the ${record.channel} delivery provider before sending.`);
  if (record.status === "Sent") return record;
  const claimed = await db.notification.updateMany({where: {id, status: {in: ["Draft", "Queued", "Failed"]}}, data: {status: "Sending", error: null, version: {increment: 1}}});
  if (!claimed.count) throw new HttpError(409, "This notification is already being sent.");
  try {
    let providerId: string;
    if (record.channel === "Email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.recipient)) throw new Error("Use the recipient's email address.");
      const response = await fetch("https://api.resend.com/emails", {method: "POST", headers: {Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `notification-${id}`}, body: JSON.stringify({from: process.env.EMAIL_FROM, to: [record.recipient], subject: "Falak Rides booking update", text: record.message}), signal: AbortSignal.timeout(15000)});
      const result = await response.json(); if (!response.ok) throw new Error("Email provider rejected the message. Check provider configuration."); providerId = result.id;
    } else {
      const recipient = record.recipient.replace(/[\s()-]/g, "");
      if (!/^\+\d{8,15}$/.test(recipient)) throw new Error("Use the recipient's international phone number.");
      const whatsapp = record.channel === "WhatsApp";
      const from = whatsapp ? process.env.TWILIO_WHATSAPP_FROM! : process.env.TWILIO_SMS_FROM!;
      const payload = new URLSearchParams({From: whatsapp && !from.startsWith("whatsapp:") ? `whatsapp:${from}` : from, To: whatsapp ? `whatsapp:${recipient}` : recipient, Body: record.message});
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {method: "POST", headers: {Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded"}, body: payload, signal: AbortSignal.timeout(15000)});
      const result = await response.json(); if (!response.ok) throw new Error("Messaging provider rejected the message. Check provider configuration."); providerId = result.sid;
    }
    return await db.notification.update({where: {id}, data: {status: "Sent", providerId, error: null, version: {increment: 1}}});
  } catch (error) {
    await db.notification.update({where: {id}, data: {status: "Failed", error: error instanceof Error ? error.message : "Delivery failed", version: {increment: 1}}});
    throw new HttpError(502, error instanceof Error ? error.message : "Delivery failed. The notification was not marked as sent.");
  }
}
