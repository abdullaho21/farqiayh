import { db } from "@/lib/db";
import { route, sameOrigin, ok } from "@/lib/http";
import { ADMIN_COOKIE, cookieOptions, digest } from "@/lib/auth";
export const POST = route(async (req) => {
  sameOrigin(req);
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token)
    await db.adminSession.deleteMany({ where: { tokenHash: digest(token) } });
  const res = ok({ admin: false });
  res.cookies.set(ADMIN_COOKIE, "", cookieOptions(0));
  return res;
});
