import type {AdminRow} from "./types";
export function revenueSeries(payments: AdminRow[], days: number, now = new Date()) {
  const end = new Date(now.toLocaleDateString("en-CA", {timeZone: "Asia/Riyadh"}) + "T00:00:00+03:00");
  const dates = Array.from({length: days}, (_, index) => new Date(end.getTime() - (days - index - 1) * 86400000));
  const values = dates.map(date => payments.filter(row => row.status === "Paid" && row._paidAt && new Date(row._paidAt).toLocaleDateString("en-CA", {timeZone: "Asia/Riyadh"}) === date.toLocaleDateString("en-CA", {timeZone: "Asia/Riyadh"})).reduce((sum, row) => sum + Number(row.amount), 0));
  const maximum = Math.max(100, Math.ceil(Math.max(...values, 0) / 100) * 100);
  const path = values.map((value, index) => `${index ? "L" : "M"}${index * 640 / (days - 1)} ${170 - value / maximum * 160}`).join(" ");
  const labels = dates.filter((_, index) => days === 7 || index % 5 === 0 || index === days - 1).map(date => date.toLocaleDateString("en-GB", {timeZone: "Asia/Riyadh", day: "2-digit", month: "short"}));
  return {path, fill: `${path} L640 180 L0 180Z`, labels, ticks: [1, .75, .5, .25, 0].map(ratio => Math.round(maximum * ratio).toLocaleString("en-US")), total: values.reduce((sum, value) => sum + value, 0)};
}
