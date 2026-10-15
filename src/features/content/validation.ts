import {isSafePublicImage, parseWebsite} from "./website-model";
import {contentFields} from "./fields";
import type {ContentValues} from "./types";

export function validateValues(input: unknown): ContentValues {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid content.");
  const fields = new Map(contentFields.map(field => [field.id, field]));
  const result: ContentValues = {};
  for (const [id, value] of Object.entries(input)) {
    const field = fields.get(id);
    if (!field || typeof value !== "string" || value.length > (field?.kind === "website" ? 300000 : 6000) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error("Invalid content field.");
    if (field.kind === "website") parseWebsite(value);
    if (field.kind === "image" && !isSafePublicImage(value)) throw new Error("Use a local /images/ path or valid Unsplash photo ID.");
    if (field.kind === "number" && (!/^\d{1,2}$/.test(value) || Number(value) > 30)) throw new Error("Capacity must be a whole number from 0 to 30.");
    if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Enter a valid email.");
    if (field.kind === "phone" && !/^\+?[\d\s()-]{8,25}$/.test(value)) throw new Error("Enter a valid international phone number.");
    if (id === "company.name" && (!value.trim() || value.length > 80)) throw new Error("Company name must contain 1 to 80 characters.");
    if (id === "company.description" && value.length > 600) throw new Error("Company description must be 600 characters or fewer.");
    result[id] = value;
  }
  return result;
}
