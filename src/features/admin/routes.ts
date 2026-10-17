export const adminRoutes: Record<string, string> = {
  overview: "dashboard", bookings: "bookings", customers: "customers",
  drivers: "drivers", vehicles: "vehicles", fares: "fares", areas: "service-areas",
  offers: "offers", payments: "payments", feedback: "reviews",
  content: "website-content", reports: "reports", roles: "team", settings: "settings",
  notifications: "notifications",
};
export const adminSectionPath = (section: string) => `/admin/${adminRoutes[section] || "dashboard"}`;
export const adminSectionFromPath = (pathname: string) => pathname === "/admin" || pathname === "/admin/" ? "overview" : Object.keys(adminRoutes).find(key => `/admin/${adminRoutes[key]}` === pathname.replace(/\/$/, ""));
