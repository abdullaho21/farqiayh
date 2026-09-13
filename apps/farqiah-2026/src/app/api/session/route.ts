import { route, ok } from "@/lib/http";
import { establishGuest, getAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const GET = route(async (req) => {
  const admin = await getAdmin(req);
  const res = ok({ admin: !!admin, username: admin?.username || null });
  establishGuest(req, res);
  return res;
});
