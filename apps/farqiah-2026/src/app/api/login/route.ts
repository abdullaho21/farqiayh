import { z } from "zod";
import { db } from "@/lib/db";
import { sameOrigin, route, json, assert, ok } from "@/lib/http";
import { limit, createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
const dummy = hashPassword("invalid-account-timing-padding");
export const POST = route(async (req) => {
  sameOrigin(req);
  await limit(req, "login", 10, 900);
  const input = await json(
    req,
    z.object({
      username: z.string().min(1).max(80),
      password: z.string().min(1).max(256),
    }),
  );
  const admin = await db.admin.findUnique({
    where: { username: input.username },
  });
  const valid = verifyPassword(input.password, admin?.passwordHash || dummy);
  assert(admin && valid, "Incorrect username or password.", 401);
  const response = ok({ admin: true });
  await createSession(admin.id, response);
  return response;
});
