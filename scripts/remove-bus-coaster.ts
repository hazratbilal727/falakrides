import {config} from "dotenv";
import {isDeepStrictEqual} from "node:util";
import {PrismaClient} from "../src/generated/prisma/client";
import {databaseAdapter} from "../src/lib/db/adapter";
import type {ContentValues} from "../src/features/content/types";

config({path: ".env.local", quiet: true});
config({quiet: true});
const db = new PrismaClient({adapter: databaseAdapter(), transactionOptions: {timeout: 30000}});
const removed = /\b(?:bus|buses|coaster)\b/i;
const matches = (item: {slug?: string; name?: string; title?: string}) =>
  [item.slug, item.name, item.title].some(value => value && removed.test(value));

function clean(values: ContentValues) {
  const result = {...values};
  if (result["public.website"]) {
    const website = JSON.parse(result["public.website"]);
    for (const key of ["vehicles", "services"] as const) {
      website[key] = website[key].filter((item: {slug?: string; name?: string; title?: string}) => !matches(item));
    }
    result["public.website"] = JSON.stringify(website);
  }
  const prefixes = Object.entries(result)
    .filter(([key, value]) => /^vehicle\.\d+\.name$/.test(key) && removed.test(value))
    .map(([key]) => key.slice(0, -"name".length));
  for (const key of Object.keys(result)) if (prefixes.some(prefix => key.startsWith(prefix))) delete result[key];
  return result;
}

async function main() {
  try {
    const apply = process.argv.includes("--apply");
    const result = await db.$transaction(async tx => {
      const content = await tx.siteContent.findUniqueOrThrow({where: {id: "main"}});
      const vehicles = (await tx.vehicle.findMany({select: {id: true, name: true, category: true}})).filter(matches);
      const draft = clean(content.draft as ContentValues);
      const published = clean(content.published as ContentValues);
      const changed = !isDeepStrictEqual(draft, content.draft) || !isDeepStrictEqual(published, content.published);
      if (apply) {
        if (changed) await tx.siteContent.update({where: {id: "main", version: content.version}, data: {draft, published, version: {increment: 1}, publishedAt: new Date()}});
        if (vehicles.length) await tx.vehicle.deleteMany({where: {id: {in: vehicles.map(vehicle => vehicle.id)}}});
        if (changed || vehicles.length) await tx.auditLog.create({data: {action: "remove-bus-coaster", resource: "content", recordId: "main"}});
      }
      return {applied: apply, contentChanged: changed, matchingFleetVehicles: vehicles.map(({name, category}) => ({name, category})), remainingWebsiteVehicles: JSON.parse(published["public.website"] || "{}").vehicles?.map((vehicle: {name: string}) => vehicle.name)};
    });
    console.log(JSON.stringify(result));
  } finally {await db.$disconnect();}
}
void main().catch(error => {console.error(error instanceof Error ? error.message : "Removal failed"); process.exitCode = 1;});
