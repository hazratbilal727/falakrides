import {requireAdmin} from "@/lib/auth";
import {requireDeveloperPin} from "@/features/content/developer-pin-store";
import {getCloudinary, cloudinaryUploadFolder} from "@/lib/cloudinary";
import {failure, HttpError, json, sameOrigin, rateLimit} from "@/lib/security/http";
import {imageMimeType, MAX_CONTENT_IMAGE_BYTES} from "@/features/content/image-upload";
import {db} from "@/lib/db";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const user = await requireAdmin("content", true);
    sameOrigin(request); await requireDeveloperPin(request, user.id);
    await rateLimit(request, "developer-media-uploads", 20);
    const kind = new URL(request.url).searchParams.get("kind");
    if (kind !== "image" && kind !== "audio") throw new HttpError(400, "Choose an image or MP3 file.");
    const limit = kind === "image" ? MAX_CONTENT_IMAGE_BYTES : 20 * 1024 * 1024;
    const tooLarge = kind === "image" ? "Choose an image smaller than 8 MB." : "Choose an MP3 smaller than 20 MB.";
    if (Number(request.headers.get("content-length")) > limit) throw new HttpError(413, tooLarge);
    const reader = request.body?.getReader(); if (!reader) throw new HttpError(400, "Choose a file.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > limit) {await reader.cancel(); throw new HttpError(413, tooLarge);} chunks.push(chunk.value);}
    const data = Buffer.concat(chunks);
    const mp3 = data.length >= 4 && (data.subarray(0, 3).toString() === "ID3" || (data[0] === 0xff && (data[1] & 0xe6) === 0xe2 && (data[2] & 0xf0) !== 0xf0 && (data[2] & 0x0c) !== 0x0c));
    if (kind === "image" ? !imageMimeType(data) : !mp3) throw new HttpError(415, kind === "image" ? "Choose a valid JPG, PNG, WebP, GIF or AVIF image." : "Choose a valid MP3 audio file.");
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new HttpError(503, "Configure Cloudinary to upload media.");
    const result = await new Promise<{secure_url: string; public_id: string}>((resolve, reject) => {
      getCloudinary().uploader.upload_stream({folder: `${cloudinaryUploadFolder()}/developer-mode`, resource_type: kind === "image" ? "image" : "video", allowed_formats: kind === "image" ? ["jpg", "png", "webp", "gif", "avif"] : ["mp3"], overwrite: false}, (error, result) => {if (error || !result) reject(new HttpError(502, "Media upload failed. Please try again.")); else resolve(result);}).end(data);
    });
    await db.auditLog.create({data: {userId: user.id, action: "upload-media", resource: "developer-mode", recordId: result.public_id}});
    return json({url: result.secure_url});
  } catch (error) {return failure(error);}
}
