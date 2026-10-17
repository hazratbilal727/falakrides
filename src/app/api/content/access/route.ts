import {requireAdmin} from "@/lib/auth";
import {failure, json, sameOrigin} from "@/lib/security/http";
export const runtime = "nodejs";
// Compatibility for older clients: content access now follows the admin session.
export async function POST(request: Request) {
  try {await requireAdmin("content", true); sameOrigin(request); return json({ok: true});}
  catch (error) {return failure(error);}
}
