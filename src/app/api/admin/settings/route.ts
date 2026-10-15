import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {db} from "@/lib/db";
import {body, failure, HttpError, json} from "@/lib/security/http";
import type {ContentValues} from "@/features/content/types";
const schema = z.object({name: z.string().trim().min(1).max(80), phone: z.string().trim().regex(/^\+?[\d\s()-]{8,25}$/), email: z.email(), currency: z.literal("SAR"), timezone: z.literal("Asia/Riyadh"), description: z.string().trim().max(600), version: z.number().int().positive()});
export async function PUT(request: Request) {
  try {
    const user = await requireAdmin("settings", true); const input = schema.parse(await body(request));
    const settings = await db.$transaction(async tx => {
      const {version, ...values} = input;
      const changed = await tx.siteSettings.updateMany({where: {id: "main", version}, data: {...values, version: {increment: 1}}});
      if (!changed.count) throw new HttpError(409, "Company settings changed. Refresh before saving.");
      const content = await tx.siteContent.findUniqueOrThrow({where: {id: "main"}});
      const overlay = {"contact.phone": values.phone, "contact.email": values.email, "company.name":values.name, "company.description":values.description};
      await tx.siteContent.update({where: {id: "main", version: content.version}, data: {version: {increment: 1}, draft: {...content.draft as ContentValues, ...overlay}, published: {...content.published as ContentValues, ...overlay}, publishedAt: new Date()}});
      await tx.auditLog.create({data: {userId: user.id, action: "update", resource: "settings", recordId: "main"}});
      return tx.siteSettings.findUniqueOrThrow({where: {id: "main"}});
    });
    return json({settings});
  } catch (error) {return failure(error);}
}
