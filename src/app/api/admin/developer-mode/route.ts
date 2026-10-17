import {z} from "zod";
import {isSafePauseMedia} from "@/features/content/website-availability";
import {requireAdmin} from "@/lib/auth";
import {body, failure, json} from "@/lib/security/http";
import {readWebsiteAvailability, setWebsiteAvailability} from "@/features/content/website-availability-store";
import {requireDeveloperPin} from "@/features/content/developer-pin-store";

const schema = z.object({paused: z.boolean(), messageEnabled: z.boolean().default(false), image: z.string().max(2000).default(""), audio: z.string().max(2000).default(""), version: z.number().int().nonnegative()}).strict()
  .refine(input => !(input.paused && input.messageEnabled), {message: "Choose either 404 or background media mode."})
  .refine(input => !input.image || isSafePauseMedia(input.image, "image"), {message: "Choose a valid background image."})
  .refine(input => !input.audio || isSafePauseMedia(input.audio, "audio"), {message: "Choose a valid MP3 audio file."})
  .refine(input => !input.messageEnabled || !!input.image, {message: "Choose a background image before enabling this mode."});

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
    return json(await setWebsiteAvailability(input, user.id));
  } catch (error) {return failure(error);}
}
