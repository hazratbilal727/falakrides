import {PrismaClient} from "@/generated/prisma/client";
import {databaseAdapter} from "./adapter";

const globalDb = globalThis as unknown as {falakDb?: PrismaClient; falakDbUrl?: string; falakDbType?: typeof PrismaClient};
export const db = globalDb.falakDb && globalDb.falakDbUrl === process.env.DATABASE_URL && globalDb.falakDbType === PrismaClient ? globalDb.falakDb : new PrismaClient({adapter: databaseAdapter(), transactionOptions: {maxWait: 10000, timeout: 30000}});
if (process.env.NODE_ENV !== "production") {globalDb.falakDb = db; globalDb.falakDbUrl = process.env.DATABASE_URL; globalDb.falakDbType = PrismaClient;}
