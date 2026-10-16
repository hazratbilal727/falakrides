import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {body, failure, json} from "@/lib/security/http";
import {readWebsiteAvailability, setWebsiteAvailability} from "@/features/content/website-availability-store";
import {requireDeveloperPin} from "@/features/content/developer-pin-store";

const schema = z.object({paused: z.boolean(), version: z.number().int().nonnegative()}).strict();

export async function GET(request: Request) {
  try {
    const user = await requireAdmin("content", true);
    await requireDeveloperPin(request, user.id);
    return json(await readWebsiteAvailability());
  } catch (error) {return failure(error);}
}

export async function PUT(request: Request) {
  try {
    const user = await requireAdmin("content", true);
    const input = schema.parse(await body(request));
    await requireDeveloperPin(request, user.id);
    return json(await setWebsiteAvailability(input.paused, input.version, user.id));
  } catch (error) {return failure(error);}
}
