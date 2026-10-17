import {z} from "zod";
import {db} from "@/lib/db";
import {body, failure, json, rateLimit} from "@/lib/security/http";
export async function POST(request: Request) {
  try {
    const input = z.object({name: z.string().trim().min(1).max(80), email: z.email().max(160), message: z.string().trim().min(1).max(1500)}).parse(await body(request, 10000));
    await rateLimit(request, "inquiry", 10, 600);
    const inquiry = await db.$transaction(async tx => {
      const record = await tx.inquiry.create({data: input});
      await tx.feedback.create({data: {customer: `${input.name} (${input.email})`, type: "Inquiry", rating: null, message: input.message, status: "Pending"}});
      return record;
    });
    return json({id: inquiry.id}, 201);
  } catch (error) {return failure(error);}
}
