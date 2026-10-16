import {config} from "dotenv";
import {PrismaClient} from "../src/generated/prisma/client";
import {databaseAdapter} from "../src/lib/db/adapter";
import type {ContentValues} from "../src/features/content/types";

config({path: ".env.local", quiet: true});
config({quiet: true});
const db = new PrismaClient({adapter: databaseAdapter(), transactionOptions: {maxWait: 10000, timeout: 30000}});
async function main() {
  try {
    await db.$transaction(async tx => {
      const record = await tx.siteContent.findUniqueOrThrow({where: {id: "main"}});
      const update = (stored: unknown) => {
        const values = {...stored as ContentValues};
        if (values["public.website"]) {
          const website = JSON.parse(values["public.website"]);
          website.copy.whyImage = "/images/reference/gmc-transparent.png";
          values["public.website"] = JSON.stringify(website);
        }
        return values;
      };
      await tx.siteContent.update({where: {id: "main", version: record.version}, data: {draft: update(record.draft), published: update(record.published), version: {increment: 1}, publishedAt: new Date()}});
      await tx.auditLog.create({data: {action: "update-why-image-black-gmc", resource: "content", recordId: "main"}});
    });
    const record = await db.siteContent.findUniqueOrThrow({where: {id: "main"}});
    for (const key of ["draft", "published"] as const) {
      const website = JSON.parse((record[key] as ContentValues)["public.website"]);
      if (website.copy.whyImage !== "/images/reference/gmc-transparent.png") throw new Error("Image update verification failed.");
    }
    console.log("Verified black GMC image in draft and published content.");
  } finally {await db.$disconnect();}
}
void main().catch(error => {console.error(error instanceof Error ? error.message : "Image update failed"); process.exitCode = 1;});
