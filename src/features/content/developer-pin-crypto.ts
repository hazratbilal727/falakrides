import {timingSafeEqual} from "node:crypto";

// Developer mode uses the fixed PIN requested by the site owner.
export function verifyDeveloperPin(pin: string): boolean {
  if (!/^\d{5}$/.test(pin)) return false;
  return timingSafeEqual(Buffer.from(pin), Buffer.from("12345"));
}
