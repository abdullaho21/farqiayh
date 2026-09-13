import { route, sameOrigin, json, assert, ok } from "@/lib/http";
import { readGuest, limit } from "@/lib/auth";
import { voteInput } from "@/lib/validation";
import { castVote } from "@/lib/polls";
export const POST = route(async (req) => {
  sameOrigin(req);
  const guest = readGuest(req);
  assert(guest, "Please refresh to start your voting session.", 401);
  await limit(req, "vote", 60, 60, guest);
  const data = await json(req, voteInput);
  return ok(await castVote(data, guest), 201);
});
