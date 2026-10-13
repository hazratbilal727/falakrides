import {requireAdmin} from "@/lib/auth";
import {writeRecord} from "@/features/admin/server";
import {body, failure, json} from "@/lib/security/http";
export const runtime = "nodejs";
export async function POST(request: Request, context: {params: Promise<{module: string}>}) {
  try {const {module} = await context.params; const user = await requireAdmin(module, true); return json(await writeRecord(module, await body(request), user), 201);} catch (error) {return failure(error);}
}
