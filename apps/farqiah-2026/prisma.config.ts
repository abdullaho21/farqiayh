import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --env-file-if-exists=.env --import tsx prisma/seed.ts",
  },
  // Generation and builds need no database; database commands require this URL.
  datasource: { url: process.env.DATABASE_URL },
});
