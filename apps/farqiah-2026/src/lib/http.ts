import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodType } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assert(
  value: unknown,
  message: string,
  status = 400,
): asserts value {
  if (!value) throw new HttpError(status, message);
}
export async function json<T>(
  req: Request,
  schema: ZodType<T, any, any>,
): Promise<T> {
  assert(
    Number(req.headers.get("content-length") || 0) <= 256_000,
    "Request is too large.",
    413,
  );
  const reader = req.body?.getReader();
  assert(reader, "Request body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 256_000) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  try {
    return schema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (error) {
    if (error instanceof ZodError) throw error;
    throw new HttpError(400, "Invalid JSON.");
  }
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const expected = new URL(process.env.APP_URL || "http://localhost:3000")
    .origin;
  assert(origin === expected, "Request origin is not allowed.", 403);
}
export function route(fn: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      return await fn(req);
    } catch (error) {
      if (error instanceof HttpError)
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      if (error instanceof ZodError)
        return NextResponse.json(
          { error: error.issues[0]?.message || "Invalid input." },
          { status: 400 },
        );
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034"].includes(error.code)
      )
        return NextResponse.json(
          {
            error:
              "The poll changed or this vote was already received. Refresh and try again.",
          },
          { status: 409 },
        );
      console.error(
        "Farqiah request failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  };
}
export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
