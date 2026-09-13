import { db } from "@/lib/db";
import { requireAdmin, limit } from "@/lib/auth";
import { route, sameOrigin, assert, ok, HttpError } from "@/lib/http";
import { MAX_MEDIA_BYTES, detectImage } from "@/lib/media";
export const POST = route(async (req) => {
  sameOrigin(req);
  const admin = await requireAdmin(req);
  await limit(req, "upload", 20, 60, admin.id);
  assert(
    Number(req.headers.get("content-length") || 0) <= MAX_MEDIA_BYTES,
    "Images must be 3 MB or smaller.",
    413,
  );
  const reader = req.body?.getReader();
  assert(reader, "Choose an image.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_MEDIA_BYTES) {
      await reader.cancel();
      throw new HttpError(413, "Images must be 3 MB or smaller.");
    }
    chunks.push(value);
  }
  const data = Buffer.concat(chunks);
  const mime = detectImage(data);
  assert(mime, "Use a GIF, PNG, JPEG, or WebP image.");
  const media = await db.media.create({
    data: {
      name: (req.headers.get("x-file-name") || "image").slice(0, 160),
      data,
      mime,
    },
  });
  return ok({ url: `/api/media/${media.id}` }, 201);
});
