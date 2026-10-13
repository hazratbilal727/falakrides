import {visitor} from "@/lib/auth/visitor";
import {db} from "@/lib/db";
import {body, failure, json, rateLimit} from "@/lib/security/http";
import {bookingSchema, createBooking, publicBooking} from "@/features/bookings/server";
export async function GET() {try {const customer = await visitor(); const bookings = customer ? await db.booking.findMany({where: {customerId: customer.id}, orderBy: {createdAt: "desc"}}) : []; return json({bookings: bookings.map(publicBooking)});} catch (error) {return failure(error);}}
export async function POST(request: Request) {
  try {const input = bookingSchema.parse(await body(request, 20000)); await rateLimit(request, "bookings", 20, 600); const customer = await visitor(true); return json({booking: await createBooking(input, customer!.id)}, 201);} catch (error) {return failure(error);}
}
