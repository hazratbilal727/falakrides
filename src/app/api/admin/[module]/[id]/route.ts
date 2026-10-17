import {requireAdmin} from "@/lib/auth";
import {writeRecord, deleteRecord} from "@/features/admin/server";
import {body, failure, json} from "@/lib/security/http";
export const runtime = "nodejs";
type Context = {params: Promise<{module: string; id: string}>};
export async function PATCH(request: Request, context: Context) {
  try {const {module, id} = await context.params; const user = await requireAdmin(module, true); return json(await writeRecord(module, await body(request), user, id));} catch (error) {return failure(error);}
}
export async function DELETE(request: Request, context: Context) {
  try {const {module, id} = await context.params; const user = await requireAdmin(module, true); const input = await body(request); await deleteRecord(module, id, Number(input.version), user); return json({ok: true});} catch (error) {return failure(error);}
}
