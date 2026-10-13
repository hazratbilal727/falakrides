import type {AdminRow} from "./types";

export const bookingStatuses = ["Completed", "Confirmed", "Pending", "Cancelled", "Rejected"] as const;
const statusColors = ["#15803d", "#91bd8c", "#e8bd64", "#e6eae3", "#d49e8e"];

/** Keep the status chart valid when the final record is removed. */
export function bookingGradient(rows: AdminRow[]): string {
  if (rows.length === 0) return "conic-gradient(#e6eae3 0% 100%)";
  let end = 0;
  const stops = bookingStatuses.map((status, index) => {
    const start = end;
    end += rows.filter(row => row.status === status).length / rows.length * 100;
    return `${statusColors[index]} ${start}% ${end}%`;
  });
  stops.push(`#e6eae3 ${end}% 100%`);
  return `conic-gradient(${stops.join(", ")})`;
}

/** Demo identifiers also work on a phone opening an HTTP LAN preview. */
export function createRecordId(prefix: string, existing: string[], randomUUID?: () => string): string {
  let suffix = "";
  try { suffix = randomUUID?.().replaceAll("-", "").slice(0, 8).toUpperCase() || ""; } catch { /* Use sequential demo IDs below. */ }
  if (suffix && !existing.includes(`${prefix}-${suffix}`)) return `${prefix}-${suffix}`;
  let number = 1;
  while (existing.includes(`${prefix}-${String(number).padStart(6, "0")}`)) number++;
  return `${prefix}-${String(number).padStart(6, "0")}`;
}
