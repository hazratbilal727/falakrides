export type WebsiteAvailability = {paused: boolean; version: number};

export function websitePaused(value: unknown): boolean {
  return !!value && typeof value === "object" && "paused" in value && value.paused === true;
}

export function isPublicPage(pathname: string): boolean {
  return !["/admin", "/api", "/_next", "/login", "/register", "/images", "/fonts"].some(path => pathname === path || pathname.startsWith(`${path}/`))
    && !["/favicon.ico", "/robots.txt", "/sitemap.xml"].includes(pathname);
}

export async function websiteAvailabilityResponse(pathname: string, read: () => Promise<{paused: boolean}>): Promise<Response | null> {
  if (!isPublicPage(pathname)) return null;
  return (await read()).paused ? pausedWebsiteResponse() : null;
}

export function pausedWebsiteResponse(): Response {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>404 | Page not found</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#2a2b34;font:16px Arial,sans-serif}main{text-align:center;padding:32px}strong{display:block;font-size:72px;color:#8dc73f}h1{font-size:24px}p{color:#626862}</style></head><body><main><strong>404</strong><h1>Page not found</h1><p>This page is unavailable.</p></main></body></html>', {
    status: 404,
    headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "same-origin"},
  });
}
