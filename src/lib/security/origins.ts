function vercelOrigins(): string[] {
  if (process.env.VERCEL !== "1") return [];
  return [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
    .filter((host): host is string => !!host)
    .map(host => new URL(`https://${host}`).origin);
}

export function authBaseURL(): string {
  const configured = process.env.BETTER_AUTH_URL || process.env.SITE_URL;
  const hosted = vercelOrigins();
  // A local .env value must not override the deployed application's origin.
  if (configured && (!hosted.length || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(configured).hostname))) return new URL(configured).origin;
  return hosted[0] || configured || "http://localhost:3000";
}

export function trustedOrigins(request?: Request): string[] {
  const origins = new Set<string>();
  for (const value of [authBaseURL(), ...vercelOrigins(), process.env.SITE_URL, ...(process.env.AUTH_TRUSTED_ORIGINS || "").split(",")]) {
    if (!value?.trim()) continue;
    const url = new URL(value.trim());
    if (["http:", "https:"].includes(url.protocol)) origins.add(url.origin);
  }
  if (process.env.NODE_ENV === "development" && request) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const url = new URL(origin);
        if (["http:", "https:"].includes(url.protocol) && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) origins.add(url.origin);
      } catch { /* Invalid origins remain untrusted. */ }
    }
  }
  return [...origins];
}
