import {PrismaNeon} from "@prisma/adapter-neon";

export function databaseAdapter(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  const schema = new URL(connectionString).searchParams.get("schema") || "public";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) throw new Error("Invalid database schema.");
  return new PrismaNeon({connectionString, max: 10, connectionTimeoutMillis: 15000}, {schema});
}
