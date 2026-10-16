import {db} from "@/lib/db";
import {HttpError} from "@/lib/security/http";
import {websitePaused, type WebsiteAvailability} from "./website-availability";

// A separate control record keeps immediate availability changes out of CMS drafts.
const controlId = "website-availability";

export async function readWebsiteAvailability(): Promise<WebsiteAvailability> {
  const record = await db.siteContent.findUnique({where: {id: controlId}, select: {published: true, version: true}});
  return {paused: websitePaused(record?.published), version: record?.version ?? 0};
}

export async function setWebsiteAvailability(paused: boolean, version: number, userId: string): Promise<WebsiteAvailability> {
  return db.$transaction(async tx => {
    // Initialize once without changing the default live state.
    await tx.siteContent.upsert({where: {id: controlId}, create: {id: controlId, version: 0, draft: {paused: false}, published: {paused: false}}, update: {}});
    const changed = await tx.siteContent.updateMany({where: {id: controlId, version}, data: {version: {increment: 1}, draft: {paused}, published: {paused}, publishedAt: new Date()}});
    if (changed.count !== 1) throw new HttpError(409, "Website status changed. Reload Developer mode before trying again.");
    await tx.auditLog.create({data: {userId, action: paused ? "pause-website" : "resume-website", resource: "developer-mode", recordId: controlId}});
    return {paused, version: version + 1};
  });
}
