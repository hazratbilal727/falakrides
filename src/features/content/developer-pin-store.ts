import {HttpError, rateLimit} from "@/lib/security/http";
import {verifyDeveloperPin} from "./developer-pin-crypto";

export async function requireDeveloperPin(request: Request, userId: string): Promise<void> {
  const pin = request.headers.get("x-developer-pin");
  if (!pin) throw new HttpError(403, "Developer mode is locked. Enter your PIN.");
  await rateLimit(request, `developer-pin:${userId}`, 30, 300);
  if (!verifyDeveloperPin(pin)) throw new HttpError(403, "Incorrect PIN. Please try again.");
}
