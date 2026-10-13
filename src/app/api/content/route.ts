import {cookies} from "next/headers";
import {readContent, updateContent, validateValues} from "@/features/content/store";
import {configured, CONTENT_COOKIE, validSession} from "@/features/content/security";
import {requireAdmin} from "@/lib/auth";
import {body, failure, HttpError, json, rateLimit} from "@/lib/security/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.has("admin")) {
      await requireAdmin("content", true);
      const token = (await cookies()).get(CONTENT_COOKIE)?.value;
      if (configured() && !validSession(token)) throw new HttpError(401, "Enter your PIN to manage website content.");
      return json({...await readContent(), accessExpiresAt: configured() ? Number(token!.split(".")[0]) : Date.now() + 8 * 3600000});
    }
    const content = await readContent();
    return json({values: content.published, catalog: content.catalog, version: content.version, publishedAt: content.publishedAt});
  } catch (error) {return failure(error);}
}
export async function POST(request: Request) {
  try {
    const user = await requireAdmin("content", true);
    const input = await body(request);
    if (configured() && !validSession((await cookies()).get(CONTENT_COOKIE)?.value)) throw new HttpError(401, "Content access expired. Enter your PIN again.");
    await rateLimit(request, "content-writes", 60);
    if (!["save", "publish"].includes(input.action) || !Number.isSafeInteger(input.version)) throw new HttpError(400, "Invalid update.");
    let values;
    try {values = validateValues(input.values);} catch (error) {throw new HttpError(400, (error as Error).message);}
    try {return json(await updateContent(input.version, values, input.action === "publish", user.id));}
    catch (error) {if ((error as Error).message === "CONFLICT") throw new HttpError(409, "Someone else saved changes. Reload the editor before saving again."); throw error;}
  } catch (error) {return failure(error);}
}