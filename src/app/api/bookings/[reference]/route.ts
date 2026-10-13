import {z} from "zod";
import {visitor} from "@/lib/auth/visitor";
import {body, failure, HttpError, json, rateLimit} from "@/lib/security/http";
import {bookingSchema, updateBooking} from "@/features/bookings/server";
export async function PATCH(request: Request, context: {params: Promise<{reference: string}>}) {
  try {const input = z.object({action: z.enum(["cancel", "reschedule"]), version: z.number().int().positive(), ride: bookingSchema.optional()}).parse(await body(request, 20000)); await rateLimit(request, "booking-update", 30); const customer = await visitor(); if (!customer) throw new HttpError(401, "Open this booking on the device used to request it."); const {reference} = await context.params; return json({booking: await updateBooking(reference, customer.id, input)});} catch (error) {return failure(error);}
}
