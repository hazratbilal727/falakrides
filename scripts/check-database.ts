import {config} from "dotenv";
import {PrismaClient} from "../src/generated/prisma/client";
import {databaseAdapter} from "../src/lib/db/adapter";

config({path: ".env.local", quiet: true});
const db = new PrismaClient({adapter: databaseAdapter()});
async function main() {
  try {
    const result = await db.$queryRaw<{connected: number}[]>`SELECT 1 AS connected`;
    const tables = await db.$queryRaw<{count: bigint}[]>`SELECT count(*) AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
    console.log(JSON.stringify({connected: result[0]?.connected === 1, publicTables: Number(tables[0]?.count || 0)}));
  } catch (error) {
    console.error("Database connection check failed:", error instanceof Error ? error.name : "UnknownError");
    process.exitCode = 1;
  } finally {await db.$disconnect();}
}
void main();
