import {NextResponse, type NextRequest} from "next/server";
import {readWebsiteAvailability} from "@/features/content/website-availability-store";
import {websiteAvailabilityResponse} from "@/features/content/website-availability";
export async function proxy(request: NextRequest) {
  const paused = await websiteAvailabilityResponse(request.nextUrl.pathname, readWebsiteAvailability);
  if (paused) return paused;
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}
export const config = {matcher: ["/((?!_next/static|_next/image|images/|fonts/|favicon.ico|robots.txt|sitemap.xml).*)"]};
