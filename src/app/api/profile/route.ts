import {z} from "zod";
import {visitor} from "@/lib/auth/visitor";
import {db} from "@/lib/db";
import {body, failure, HttpError, json, rateLimit} from "@/lib/security/http";
const schema = z.object({name: z.string().trim().min(1).max(80), email: z.union([z.email().max(120), z.literal("")]), phone: z.string().trim().max(25).refine(value => !value || /^\+?[\d\s()-]+$/.test(value) && value.replace(/\D/g, "").length >= 8 && value.replace(/\D/g, "").length <= 15, "Enter a valid contact number."), image: z.string().max(500000).refine(value => !value || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value), "Choose a valid profile image."), version: z.number().int().nonnegative().default(0)});
export async function GET() {
  try {const customer = await visitor(); return json(customer ? {name: customer.name, email: customer.email, phone: customer.phone, image: customer.image, version: customer.version} : {name: "", email: "", phone: "", image: "", version: 0});} catch (error) {return failure(error);}
}
export async function PUT(request: Request) {
  try {const {version, ...input} = schema.parse(await body(request)); await rateLimit(request, "profile", 30); const existing = await visitor(); if (existing && existing.version !== version || !existing && version !== 0) throw new HttpError(409, "Your profile changed in another tab. Reopen this page before saving; your edits have not been discarded."); const customer = existing || await visitor(true); const saved = await db.customer.update({where: {id: customer!.id, version: customer!.version}, data: {...input, version: {increment: 1}}}); return json({...input, version: saved.version});} catch (error) {return failure(error);}
}
