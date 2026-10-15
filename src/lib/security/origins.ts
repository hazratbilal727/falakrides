export function trustedOrigins(request?: Request): string[] {
  const origins = new Set<string>();
  for (const value of [process.env.BETTER_AUTH_URL || "http://localhost:3000", process.env.SITE_URL, ...(process.env.AUTH_TRUSTED_ORIGINS || "").split(",")]) {
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
