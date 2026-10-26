import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { postgresConnection } from "./db-config";

const globalDb = globalThis as unknown as { prisma?: PrismaClient };
const { connectionString, schema } = postgresConnection(
  process.env.DATABASE_URL,
);
export const db =
  globalDb.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString,
        connectionTimeoutMillis: 5_000,
        idleTimeoutMillis: 300_000,
      },
      { schema },
    ),
  });
if (process.env.NODE_ENV !== "production") globalDb.prisma = db;
