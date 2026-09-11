import { z } from "zod";
import { requireAdmin, limit } from "@/lib/auth";
import { route, sameOrigin, json, ok } from "@/lib/http";
import { pollInput } from "@/lib/validation";
import {
  createPoll,
  savePoll,
  pollAction,
  migrateOption,
  startFinal,
} from "@/lib/polls";
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), data: pollInput }),
  z.object({
    action: z.literal("save"),
    id: z.string(),
    revision: z.number().int(),
    data: pollInput,
  }),
  z.object({
    action: z.enum(["open", "close", "delete", "publish", "duplicate"]),
    id: z.string(),
    revision: z.number().int(),
  }),
  z.object({
    action: z.literal("migrate"),
    id: z.string(),
    revision: z.number().int(),
    sourceId: z.string(),
    targetId: z.string(),
  }),
  z.object({
    action: z.literal("final"),
    id: z.string(),
    revision: z.number().int(),
    selections: z.record(z.array(z.string()).min(2).max(50)),
  }),
]);
export const POST = route(async (req) => {
  sameOrigin(req);
  const admin = await requireAdmin(req);
  await limit(req, "admin", 120, 60, admin.id);
  const data = await json(req, input);
  if (data.action === "create") return ok(await createPoll(data.data), 201);
  if (data.action === "save") {
    await savePoll(data.id, data.data, data.revision);
    return ok({ id: data.id });
  }
  if (data.action === "migrate")
    return ok(
      await migrateOption(data.id, data.sourceId, data.targetId, data.revision),
    );
  if (data.action === "final") {
    await startFinal(data.id, data.selections, data.revision);
    return ok({ id: data.id });
  }
  return ok(await pollAction(data.id, data.action, data.revision));
});
