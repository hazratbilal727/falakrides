import {config} from "dotenv";
config({path:".env.local",quiet:true});config({quiet:true});
import {PrismaClient} from "../src/generated/prisma/client";
import {databaseAdapter} from "../src/lib/db/adapter";
import {websiteField,websiteFromValues} from "../src/features/content/website-model";
import type {ContentValues} from "../src/features/content/types";
const db=new PrismaClient({adapter:databaseAdapter()});
async function main(){try{const result=await db.$transaction(async tx=>{const record=await tx.siteContent.findUniqueOrThrow({where:{id:"main"}});const settings=await tx.siteSettings.findUniqueOrThrow({where:{id:"main"}});const defaults={[websiteField.id]:websiteField.value,"company.name":settings.name,"company.description":settings.description};const draft={...defaults,...record.draft as ContentValues},published={...defaults,...record.published as ContentValues};const changed=Object.keys(defaults).some(key=>!(key in (record.draft as ContentValues))||!(key in (record.published as ContentValues)));if(changed){const updated=await tx.siteContent.updateMany({where:{id:"main",version:record.version},data:{draft,published,version:{increment:1},publishedAt:new Date()}});if(updated.count!==1)throw Error("Content changed during import. Please retry.");await tx.auditLog.create({data:{action:"import-public-website",resource:"content",recordId:"main"}});}const data=websiteFromValues(published);return {changed,slides:data.slides.length,services:data.services.length,vehiclePackages:data.vehicles.length,itineraries:data.itineraries.length,faqs:data.faqs.length};});console.log(JSON.stringify(result));}finally{await db.$disconnect();}}
void main().catch(error=>{console.error(error instanceof Error?error.message:"Public content import failed.");process.exitCode=1;});
