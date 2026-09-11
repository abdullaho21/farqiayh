import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { assert } from "./http";
export const ADMIN_COOKIE = "fq_admin";
export const GUEST_COOKIE = "fq_guest";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function secret() {
  const value = process.env.APP_SECRET;
  if (!value || value.length < 32 || value.startsWith("replace-with"))
    throw new Error(
      "Set APP_SECRET to a random value of at least 32 characters.",
    );
  return value;
}
const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("hex");
export function readGuest(req: NextRequest) {
  const value = req.cookies.get(GUEST_COOKIE)?.value || "";
  const [id, signature] = value.split(".");
  if (
    !/^[a-f0-9]{64}$/.test(id || "") ||
    !/^[a-f0-9]{64}$/.test(signature || "")
  )
    return null;
  if (
    !timingSafeEqual(
      Buffer.from(sign(id), "hex"),
      Buffer.from(signature, "hex"),
    )
  )
    return null;
  return digest(id);
}
export function establishGuest(req: NextRequest, res: NextResponse) {
  if (!readGuest(req)) {
    const id = randomBytes(32).toString("hex");
    res.cookies.set(
      GUEST_COOKIE,
      `${id}.${sign(id)}`,
      cookieOptions(60 * 60 * 24 * 365),
    );
  }
}
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure:
      new URL(process.env.APP_URL || "http://localhost:3000").protocol ===
      "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
export async function getAdmin(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: digest(token) },
    include: { admin: true },
  });
  return session && session.expiresAt > new Date() ? session.admin : null;
}
export async function requireAdmin(req: NextRequest) {
  const admin = await getAdmin(req);
  assert(admin, "Please log in as admin.", 401);
  return admin;
}
export async function createSession(adminId: string, res: NextResponse) {
  const token = randomBytes(32).toString("hex");
  await db.adminSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await db.adminSession.create({
    data: {
      tokenHash: digest(token),
      adminId,
      expiresAt: new Date(Date.now() + 8 * 3600_000),
    },
  });
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions(8 * 3600));
}
export async function limit(
  req: Request,
  bucket: string,
  max: number,
  seconds: number,
  identity?: string,
) {
  // Proxy headers are trusted only when the deployment explicitly opts in.
  const ip =
    process.env.TRUST_PROXY === "true"
      ? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
      : "shared";
  const key = `${bucket}:${digest(identity || ip)}`;
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, NOW() + ${seconds} * INTERVAL '1 second')
    ON CONFLICT ("key") DO UPDATE SET "count" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1 ELSE "RateLimit"."count" + 1 END,
    "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN NOW() + ${seconds} * INTERVAL '1 second' ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  assert(
    rows[0].count <= max,
    "Too many attempts. Please wait and try again.",
    429,
  );
}
