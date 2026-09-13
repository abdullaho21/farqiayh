import { db } from "@/lib/db";
import { getAdmin } from "@/lib/auth";
import { route } from "@/lib/http";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
export const GET = route(async (req) => {
  const admin = !!(await getAdmin(req));
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let stop = () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
  const stream = new ReadableStream({
    start(controller) {
      let last = "";
      const started = Date.now();
      stop = () => {
        if (stopped) return;
        stopped = true;
        if (timer) clearTimeout(timer);
        req.signal.removeEventListener("abort", stop);
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", stop, { once: true });
      controller.enqueue(encoder.encode("retry: 2500\n\n"));
      const tick = async () => {
        if (stopped) return;
        try {
          const rows = await db.poll.findMany({
            where: {
              deletedAt: null,
              ...(admin ? {} : { status: { not: "DRAFT" as const } }),
            },
            select: { id: true, eventRevision: true },
            orderBy: { id: "asc" },
          });
          if (stopped) return;
          const key = rows.map((p) => `${p.id}:${p.eventRevision}`).join("|");
          if (key !== last || !last) {
            controller.enqueue(
              encoder.encode(
                `event: change\ndata: ${JSON.stringify({ changed: true })}\n\n`,
              ),
            );
            last = key || "empty";
          } else controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          if (!stopped)
            controller.enqueue(
              encoder.encode("event: unavailable\ndata: {}\n\n"),
            );
        }
        if (Date.now() - started > 45000) {
          stop();
          return;
        }
        if (!stopped) timer = setTimeout(tick, 1500);
      };
      void tick();
    },
    cancel() {
      stop();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
