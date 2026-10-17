import {requireAdmin} from "@/lib/auth";
import {adminSnapshot} from "@/features/admin/server";
import {failure, json} from "@/lib/security/http";
export const runtime = "nodejs";
export async function GET() {try {return json(await adminSnapshot(await requireAdmin()));} catch (error) {return failure(error);}}
