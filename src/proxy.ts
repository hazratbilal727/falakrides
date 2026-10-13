import {NextResponse} from "next/server";
export function proxy() {
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}
export const config = {matcher: ["/admin/:path*", "/api/:path*", "/login", "/register"]};
