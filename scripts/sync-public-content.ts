import {config} from "dotenv";
config({path:".env.local",quiet:true});config({quiet:true});
import {readFile} from "node:fs/promises";
import {isDeepStrictEqual} from "node:util";
import {PrismaClient} from "../src/generated/prisma/client";
import {databaseAdapter} from "../src/lib/db/adapter";
import {parseWebsite,WEBSITE_FIELD,websiteFromValues} from "../src/features/content/website-model";
import {validateValues} from "../src/features/content/validation";
import type {ContentValues} from "../src/features/content/types";
const db=new PrismaClient({adapter:databaseAdapter(),transactionOptions:{maxWait:10000,timeout:30000}});
async function main(){try{
 const snapshot=JSON.parse(await readFile("data/public-website.snapshot.json","utf8"));const defaults=validateValues({...snapshot.values,[WEBSITE_FIELD]:JSON.stringify(snapshot.website)});
 const result=await db.$transaction(async tx=>{const record=await tx.siteContent.findUnique({where:{id:"main"}});if(!record){await tx.siteContent.create({data:{id:"main",draft:defaults,published:defaults,publishedAt:new Date()}});return {changed:true,created:true};}
 function merge(stored:ContentValues):ContentValues{if(stored[WEBSITE_FIELD])parseWebsite(stored[WEBSITE_FIELD]);const values={...defaults,...stored};values[WEBSITE_FIELD]=JSON.stringify(websiteFromValues(values));return validateValues(values);}
 const draft=merge(record.draft as ContentValues),published=merge(record.published as ContentValues);const changed=!isDeepStrictEqual(draft,record.draft)||!isDeepStrictEqual(published,record.published);
 if(changed){const result=await tx.siteContent.updateMany({where:{id:"main",version:record.version},data:{draft,published,version:{increment:1},publishedAt:new Date()}});if(result.count!==1)throw Error("Content changed during import. Retry.");await tx.auditLog.create({data:{action:"seed-current-website-content",resource:"content",recordId:"main"}});}
 return {changed,fields:Object.keys(published).length,slides:snapshot.website.slides.length,services:snapshot.website.services.length,vehiclePackages:snapshot.website.vehicles.length};});console.log(JSON.stringify(result));
}finally{await db.$disconnect();}}void main().catch(e=>{console.error(e.message);process.exitCode=1;});
