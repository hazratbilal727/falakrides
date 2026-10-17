import {PrismaClient} from "@/generated/prisma/client";
import {databaseAdapter} from "./adapter";

const globalDb = globalThis as unknown as {falakDb?: PrismaClient; falakDbUrl?: string; falakDbType?: typeof PrismaClient};

function getClient() {
  if (globalDb.falakDb && globalDb.falakDbUrl === process.env.DATABASE_URL && globalDb.falakDbType === PrismaClient) return globalDb.falakDb;

  const client = new PrismaClient({adapter: databaseAdapter(), transactionOptions: {maxWait: 10000, timeout: 30000}});
  if (process.env.NODE_ENV !== "production") {
    globalDb.falakDb = client;
    globalDb.falakDbUrl = process.env.DATABASE_URL;
    globalDb.falakDbType = PrismaClient;
  }
  return client;
}

function lazyProxy<T extends object>(getTarget: () => T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const target = getTarget();
      const value = Reflect.get(target, property, target);
      if (typeof value === "function") return value.bind(target);
      if (typeof value === "object" && value !== null) return lazyProxy(() => value);
      return value;
    },
  });
}

export const db = lazyProxy(getClient);
