import "server-only";
import {v2 as cloudinary} from "cloudinary";

/** Only call from server components, route handlers, or server actions. */
export function getCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) throw new Error("Cloudinary is not configured.");
  cloudinary.config({cloud_name, api_key, api_secret, secure: true});
  return cloudinary;
}

export function cloudinaryUploadFolder() {
  return process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "falakrides";
}
