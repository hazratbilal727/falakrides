import {config} from "dotenv";
import {defineConfig} from "prisma/config";

config({path: ".env.local", quiet: true});
config({quiet: true});
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {path: "prisma/migrations", seed: "tsx prisma/seed.ts"},
  // Client generation does not need a database connection. Migration commands do.
  datasource: {url: process.env.DIRECT_URL || process.env.DATABASE_URL},
});
