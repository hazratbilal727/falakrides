const permissions: Record<string, {read: string[]; write: string[]}> = {
  Administrator: {read: ["*"], write: ["*"]},
  Dispatcher: {read: ["bookings", "customers", "drivers", "vehicles", "fares", "areas", "notifications", "feedback"], write: ["bookings", "customers", "drivers", "vehicles", "areas", "notifications"]},
  Finance: {read: ["bookings", "customers", "payments", "reports", "fares"], write: ["payments", "fares"]},
  Viewer: {read: ["bookings", "drivers", "vehicles", "fares", "areas", "offers", "feedback", "reports"], write: []},
};
export const canAccess = (role: string, resource: string, write = false) => {const allowed = permissions[role]?.[write ? "write" : "read"] || []; return allowed.includes("*") || allowed.includes(resource);};
