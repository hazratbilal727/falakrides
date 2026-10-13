import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {body, failure, json} from "@/lib/security/http";
const schema = z.object({name: z.string().trim().min(1).max(80), email: z.email().max(254)});
export async function GET() {try {const user = await requireAdmin(); return json({name: user.name, email: user.email, role: user.role});} catch (error) {return failure(error);}}
export async function PATCH(request: Request) {
  try {const user = await requireAdmin(); const input = schema.parse(await body(request)); await db.$transaction([db.user.update({where: {id: user.id}, data: {...input, email: input.email.toLowerCase(), version: {increment: 1}}}), db.auditLog.create({data: {userId: user.id, action: "update", resource: "profile", recordId: user.id}})]); return json(input);} catch (error) {return failure(error);}
}
