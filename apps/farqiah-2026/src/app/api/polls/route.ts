import { getAdmin, readGuest } from "@/lib/auth";
import { route, assert, ok } from "@/lib/http";
import { getPoll, listPolls } from "@/lib/polls";
export const dynamic = "force-dynamic";
export const GET = route(async (req) => {
  const admin = !!(await getAdmin(req));
  const id = req.nextUrl.searchParams.get("id");
  assert(!id || id.length < 100, "Invalid poll.");
  return ok(
    id ? await getPoll(id, readGuest(req), admin) : await listPolls(admin),
  );
});
