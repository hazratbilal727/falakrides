import type {AdminRow} from "./types";

export type ExportFormat = "csv" | "pdf" | "html";
export type ExportData = {name: string; title: string; rows: AdminRow[]};
const keysFor = (rows: AdminRow[]) => Array.from(new Set(rows.flatMap(row => Object.keys(row).filter(key => !key.startsWith("_")))));
export const fieldLabel = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, first => first.toUpperCase());
export function exportCsv(rows: AdminRow[]) {
  const keys = keysFor(rows);
  const cell = (value: string) => `"${(/^[\s]*[=+@\-]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
  return "\uFEFF" + [keys.map(cell).join(","), ...rows.map(row => keys.map(key => cell(row[key] || "")).join(","))].join("\r\n");
}
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[char]!));
export function exportHtml(data: ExportData) {
  const keys = keysFor(data.rows);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(data.title)} | Falak Rides</title><style>body{margin:0;background:#f6f8f4;color:#273d2e;font:14px Arial,sans-serif;padding:40px}main{background:#fff;padding:32px;border:1px solid #e1e8dc;border-radius:16px}h1{font-size:28px;font-weight:500}small,p{color:#7c8c70}table{border-collapse:collapse;width:100%;margin-top:24px}th,td{text-align:left;padding:12px;border-bottom:1px solid #e7ecdf;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#eff5ea;color:#526b42}tbody tr:nth-child(even){background:#fafcf8}.table{overflow:auto}@media print{body{padding:0;background:#fff}main{border:0;padding:0}.table{overflow:visible}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><main><small>FALAK RIDES · OPERATIONS EXPORT</small><h1>${escapeHtml(data.title)}</h1><p>${data.rows.length} records · ${escapeHtml(new Date().toISOString())}</p><div class="table"><table><thead><tr>${keys.map(key => `<th scope="col">${escapeHtml(fieldLabel(key))}</th>`).join("")}</tr></thead><tbody>${data.rows.map(row => `<tr>${keys.map(key => `<td>${escapeHtml(row[key] || "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div></main></body></html>`;
}

// Embed rendered report pages as JPEG XObjects, preserving the browser's Unicode text rendering.
export function assemblePdf(images: Uint8Array[], width: number, height: number): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const append = (data: string | Uint8Array) => {const bytes = typeof data === "string" ? encoder.encode(data) : data; parts.push(bytes); length += bytes.length;};
  const object = (id: number, data: string) => {offsets[id] = length; append(`${id} 0 obj\n${data}\nendobj\n`);};
  append("%PDF-1.4\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, `<< /Type /Pages /Count ${images.length} /Kids [${images.map((_, index) => `${3 + index * 3} 0 R`).join(" ")}] >>`);
  images.forEach((jpeg, index) => {
    const id = 3 + index * 3;
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Report ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`);
    const commands = "q\n595.28 0 0 841.89 0 0 cm\n/Report Do\nQ\n";
    object(id + 1, `<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}endstream`);
    offsets[id + 2] = length;
    append(`${id + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
    append(jpeg); append("\nendstream\nendobj\n");
  });
  const xref = length;
  append(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let index = 1; index < offsets.length; index++) append(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  append(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const result = new Uint8Array(length);
  let position = 0;
  for (const part of parts) {result.set(part, position); position += part.length;}
  return result;
}

async function exportPdf(data: ExportData) {
  await document.fonts.ready;
  const width = 1240, height = 1754, margin = 72;
  const images: Uint8Array[] = [];
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF could not be created in this browser.");
  let y = 0, page = 0;
  const startPage = () => {
    page++; context.fillStyle = "#fff"; context.fillRect(0, 0, width, height);
    context.fillStyle = "#166534"; context.font = "bold 22px Arial"; context.fillText("FALAK RIDES / OPERATIONS EXPORT", margin, 80);
    context.fillStyle = "#273d2e"; context.font = "32px Arial"; context.fillText(data.title, margin, 135);
    context.fillStyle = "#7c8c70"; context.font = "18px Arial"; context.fillText(`${data.rows.length} records | ${new Date().toISOString().slice(0, 10)} | Page ${page}`, margin, 174);
    y = 220;
  };
  const finishPage = async () => {
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("PDF rendering failed.")), "image/jpeg", .92));
    images.push(new Uint8Array(await blob.arrayBuffer()));
  };
  startPage();
  const keys = keysFor(data.rows);
  for (const row of data.rows) {
    context.font = "bold 21px Arial"; context.fillStyle = "#2b5834";
    if (y > height - 160) {await finishPage(); startPage();}
    context.fillText(row.id, margin, y); y += 36;
    for (const key of keys) {
      context.font = "18px Arial";
      const text = `${fieldLabel(key)}: ${row[key] || "—"}`;
      let line = "";
      for (const character of text) {
        if (character === "\n" || context.measureText(line + character).width > width - margin * 2) {
          if (y > height - 90) {await finishPage(); startPage(); context.font = "18px Arial";}
          context.fillStyle = "#42583d"; context.fillText(line, margin, y); y += 27;
          line = character === "\n" ? "" : character;
        } else line += character;
      }
      if (y > height - 90) {await finishPage(); startPage(); context.font = "18px Arial";}
      context.fillStyle = "#42583d"; context.fillText(line, margin, y); y += 29;
    }
    y += 20;
  }
  await finishPage();
  return new Blob([assemblePdf(images, width, height)], {type: "application/pdf"});
}
export async function createExport(data: ExportData, format: ExportFormat) {
  if (format === "pdf") return exportPdf(data);
  return new Blob([format === "csv" ? exportCsv(data.rows) : exportHtml(data)], {type: format === "csv" ? "text/csv;charset=utf-8" : "text/html;charset=utf-8"});
}
export function downloadExport(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
