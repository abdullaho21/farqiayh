// Optional in-process PostgreSQL test harness. Never imported by production code.
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PrismaClient } from "@prisma/client";

const client = new PGlite();
await client.exec(
  await readFile(
    new URL(
      "../prisma/migrations/202609120001_initial/migration.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
globalThis.prisma = new PrismaClient({ adapter: new PrismaPGlite(client) });
process.env.APP_URL = "http://localhost:3000";
process.env.APP_SECRET = "pglite-test-only-secret-of-at-least-32-characters";
