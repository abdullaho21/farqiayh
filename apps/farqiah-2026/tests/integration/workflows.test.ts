import test, { after } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { db } from "../../src/lib/db";
import {
  createPoll,
  savePoll,
  castVote,
  getPoll,
  listPolls,
  migrateOption,
  pollAction,
  startFinal,
} from "../../src/lib/polls";
import { hashPassword } from "../../src/lib/password";
import { readGuest } from "../../src/lib/auth";
import { POST as login } from "../../src/app/api/login/route";
import { POST as logout } from "../../src/app/api/logout/route";
import { GET as session } from "../../src/app/api/session/route";
import { POST as adminApi } from "../../src/app/api/admin/polls/route";
import { POST as voteApi } from "../../src/app/api/votes/route";
import { POST as upload } from "../../src/app/api/media/route";
import { GET as media } from "../../src/app/api/media/[id]/route";
import { GET as events } from "../../src/app/api/events/route";
import type { PollInput } from "../../src/lib/validation";
import type { PollView } from "../../src/lib/types";
// Run only against a dedicated test DB. Cleanup is limited to records created by this suite.
process.env.APP_URL ||= "http://localhost:3000";
process.env.APP_SECRET ||=
  "integration-only-secret-with-at-least-32-characters";
const origin = process.env.APP_URL;
const ids: string[] = [];
const mediaIds: string[] = [];
let adminId = "";
const input: PollInput = {
  title: "Integration poll",
  description: "Isolated test fixture",
  questions: [
    {
      title: "Pick two",
      type: "MULTIPLE",
      maxSelections: 2,
      options: [
        { label: "Alpha", isText: false },
        { label: "Bravo", isText: false },
        { label: "Charlie", isText: false },
        { label: "Other", isText: true },
      ],
    },
    {
      title: "Single choice",
      type: "SINGLE",
      maxSelections: 1,
      options: [
        { label: "One", isText: false },
        { label: "Two", isText: false },
      ],
    },
  ],
};
const draft = (p: PollView): PollInput => ({
  title: p.title,
  description: p.description,
  questions: p.rounds
    .find((r) => r.number === p.currentRound)!
    .questions.map((q) => ({
      id: q.id,
      title: q.title,
      type: q.type,
      maxSelections: q.maxSelections,
      mediaUrl: q.mediaUrl,
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        mediaUrl: o.mediaUrl,
        isText: o.isText,
      })),
    })),
});
const request = (
  path: string,
  body?: unknown,
  cookie = "",
  extra: Record<string, string> = {},
) =>
  new NextRequest(`${origin}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { origin, cookie, "Content-Type": "application/json", ...extra },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
after(async () => {
  if (ids.length) {
    const ballots = { question: { round: { pollId: { in: ids } } } };
    await db.textAnswer.deleteMany({ where: { ballot: ballots } });
    await db.vote.deleteMany({ where: { ballot: ballots } });
    await db.ballot.deleteMany({ where: ballots });
    await db.option.deleteMany({
      where: { question: { round: { pollId: { in: ids } } } },
    });
    await db.question.deleteMany({ where: { round: { pollId: { in: ids } } } });
    await db.round.deleteMany({ where: { pollId: { in: ids } } });
    await db.audit.deleteMany({ where: { pollId: { in: ids } } });
    await db.poll.deleteMany({ where: { id: { in: ids } } });
  }
  await db.media.deleteMany({ where: { id: { in: mediaIds } } });
  if (adminId) await db.admin.delete({ where: { id: adminId } });
  await db.$disconnect();
});
test("admin HTTP authorization, secure guest session, uploads, and logout", async () => {
  const username = `integration-${Date.now()}`;
  const a = await db.admin.create({
    data: { username, passwordHash: hashPassword("engineer") },
  });
  adminId = a.id;
  assert.equal(
    (
      await adminApi(
        request("/api/admin/polls", { action: "create", data: input }),
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await login(
        request("/api/login", { username, password: "engineer" }, "", {
          origin: "https://evil.example",
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (await login(request("/api/login", { username, password: "wrong" })))
      .status,
    401,
  );
  const res = await login(
    request("/api/login", { username, password: "engineer" }),
  );
  assert.equal(res.status, 200);
  const cookie = res.headers.get("set-cookie")!.split(";")[0];
  assert.match(res.headers.get("set-cookie")!, /HttpOnly/i);
  const state = await session(request("/api/session", undefined, cookie));
  assert.equal((await state.json()).admin, true);
  const guestCookie = state.headers.get("set-cookie")!.split(";")[0];
  const guest = readGuest(request("/api/session", undefined, guestCookie));
  assert.ok(guest);
  assert.equal(
    readGuest(request("/api/session", undefined, `${guestCookie}0`)),
    null,
  );
  const create = await adminApi(
    request("/api/admin/polls", { action: "create", data: input }, cookie),
  );
  assert.equal(create.status, 201);
  ids.push((await create.json()).id);
  const bytes = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  );
  const imageReq = new NextRequest(`${origin}/api/media`, {
    method: "POST",
    headers: { origin, cookie, "Content-Type": "image/gif" },
    body: bytes,
  });
  const imageRes = await upload(imageReq);
  assert.equal(imageRes.status, 201);
  const url = (await imageRes.json()).url;
  const mid = url.split("/").pop();
  mediaIds.push(mid);
  const served = await media(new Request(`${origin}${url}`), {
    params: Promise.resolve({ id: mid }),
  });
  assert.equal(served.headers.get("content-type"), "image/gif");
  assert.equal(Buffer.from(await served.arrayBuffer()).equals(bytes), true);
  const bad = await upload(
    new NextRequest(`${origin}/api/media`, {
      method: "POST",
      headers: { origin, cookie },
      body: '<svg onload="alert(1)"></svg>',
    }),
  );
  assert.equal(bad.status, 400);
  assert.equal((await logout(request("/api/logout", {}, cookie))).status, 200);
  assert.equal(
    (
      await adminApi(
        request("/api/admin/polls", { action: "create", data: input }, cookie),
      )
    ).status,
    401,
  );
});
test("guest voting, max selections, preserved votes, migration, final round, publishing", async () => {
  const created = await createPoll(input);
  ids.push(created.id);
  const id = created.id;
  assert.ok(!(await listPolls(false)).some((p) => p.id === id));
  await assert.rejects(getPoll(id, null, false), /unavailable/);
  await pollAction(id, "open", created.revision);
  let p = await getPoll(id, null, true);
  let q = p.rounds[0].questions[0];
  const [a, b, c, text] = q.options;
  await assert.rejects(
    castVote(
      { pollId: id, questionId: q.id, optionIds: [a.id, b.id, c.id] },
      "test-a",
    ),
    /between 1 and 2/,
  );
  await assert.rejects(
    castVote(
      { pollId: id, questionId: q.id, optionIds: [a.id, a.id] },
      "test-a",
    ),
    /Duplicate/,
  );
  await assert.rejects(
    castVote(
      {
        pollId: id,
        questionId: q.id,
        optionIds: [p.rounds[0].questions[1].options[0].id],
      },
      "test-a",
    ),
    /option changed/,
  );
  await assert.rejects(
    castVote({ pollId: id, questionId: q.id, optionIds: [text.id] }, "test-a"),
    /text answer/,
  );
  const concurrent = await Promise.allSettled([
    castVote(
      { pollId: id, questionId: q.id, optionIds: [a.id, b.id] },
      "test-a",
    ),
    castVote({ pollId: id, questionId: q.id, optionIds: [a.id] }, "test-a"),
  ]);
  assert.equal(concurrent.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(concurrent.filter((r) => r.status === "rejected").length, 1);
  await castVote(
    { pollId: id, questionId: q.id, optionIds: [a.id, b.id] },
    "test-overlap",
  );
  await castVote(
    {
      pollId: id,
      questionId: q.id,
      optionIds: [text.id],
      text: "My private idea",
      displayName: "Private name",
    },
    "test-text",
  );
  p = await getPoll(id, "test-text", true);
  q = p.rounds[0].questions[0];
  assert.equal(q.totalBallots, 3);
  assert.equal(q.textAnswers?.[0].text, "My private idea");
  const publicPoll = await getPoll(id, null, false);
  assert.equal("textAnswers" in publicPoll.rounds[0].questions[0], false);
  assert.equal(JSON.stringify(publicPoll).includes("Private name"), false);
  assert.equal(p.revision, 2, "Voting must not invalidate an admin editor");
  const update = draft(p);
  update.questions[0].options[0].label = "Renamed Alpha";
  update.questions[0].options[0].mediaUrl =
    "https://media.giphy.com/media/test/giphy.gif";
  update.questions[0].options.reverse();
  update.questions[0].options.push({
    label: "Added while live",
    isText: false,
  });
  await savePoll(id, update, p.revision);
  let renamed = await getPoll(id, null, true);
  assert.equal(
    renamed.rounds[0].questions[0].options.find((o) => o.id === a.id)!.votes,
    2,
  );
  assert.equal(
    renamed.rounds[0].questions[0].options.find((o) => o.id === a.id)!.label,
    "Renamed Alpha",
  );
  await assert.rejects(savePoll(id, update, p.revision), /Another admin edit/);
  const drop = draft(renamed);
  drop.questions[0].options = drop.questions[0].options.filter(
    (o) => o.id !== a.id,
  );
  await assert.rejects(savePoll(id, drop, renamed.revision), /Migrate votes/);
  const lower = draft(renamed);
  lower.questions[0].maxSelections = 1;
  await assert.rejects(
    savePoll(id, lower, renamed.revision),
    /cannot be reduced/,
  );
  const move = await migrateOption(id, a.id, b.id, renamed.revision);
  assert.ok(move.overlap >= 1);
  renamed = await getPoll(id, "test-overlap", true);
  assert.equal(
    renamed.rounds[0].questions[0].options.find((o) => o.id === b.id)!.votes,
    2,
  );
  assert.equal(renamed.rounds[0].questions[0].myVote.length, 1);
  assert.ok(!renamed.rounds[0].questions[0].options.some((o) => o.id === a.id));
  await migrateOption(id, text.id, c.id, renamed.revision);
  p = await getPoll(id, null, true);
  assert.equal(
    p.rounds[0].questions[0].textAnswers?.[0].text,
    "My private idea",
  );
  assert.equal(p.rounds[0].questions[0].textAnswers?.[0].optionId, c.id);
  await pollAction(id, "close", p.revision);
  p = await getPoll(id, null, true);
  await assert.rejects(
    castVote({ pollId: id, questionId: q.id, optionIds: [c.id] }, "late-guest"),
    /closed/,
  );
  const finalists = Object.fromEntries(
    p.rounds[0].questions.map((q) => [
      q.id,
      q.options.slice(0, 2).map((o) => o.id),
    ]),
  );
  await startFinal(id, finalists, p.revision);
  p = await getPoll(id, "test-a", true);
  assert.equal(p.status, "FINAL");
  assert.equal(p.rounds.length, 2);
  assert.equal(p.rounds[1].questions[0].totalBallots, 0);
  assert.equal(p.rounds[1].questions[0].myVote.length, 0);
  const fq = p.rounds[1].questions[0];
  assert.notEqual(fq.id, q.id);
  await castVote(
    { pollId: id, questionId: fq.id, optionIds: [fq.options[0].id] },
    "test-a",
  );
  await assert.rejects(
    castVote({ pollId: id, questionId: q.id, optionIds: [c.id] }, "past-round"),
    /question changed/,
  );
  p = await getPoll(id, null, true);
  await pollAction(id, "close", p.revision);
  p = await getPoll(id, null, true);
  await pollAction(id, "publish", p.revision);
  p = await getPoll(id, null, true);
  assert.equal(p.status, "PUBLISHED");
  assert.equal(p.rounds[1].questions[0].totalBallots, 1);
  await assert.rejects(savePoll(id, draft(p), p.revision), /locked/);
  const copy = await pollAction(id, "duplicate", p.revision);
  ids.push(copy.id);
  const copied = await getPoll(copy.id, null, true);
  assert.equal(copied.status, "DRAFT");
  assert.equal(copied.totalVotes, 0);
  await pollAction(id, "delete", p.revision);
  await assert.rejects(getPoll(id, null, true), /unavailable/);
  assert.equal(
    await db.ballot.count({ where: { question: { round: { pollId: id } } } }),
    4,
  );
});
test("guest HTTP voting needs a signed cookie and SSE detects edits across instances", async () => {
  const created = await createPoll(input);
  ids.push(created.id);
  await pollAction(created.id, "open", created.revision);
  const p = await getPoll(created.id, null, true);
  const q = p.rounds[0].questions[0];
  const body = { pollId: p.id, questionId: q.id, optionIds: [q.options[0].id] };
  assert.equal((await voteApi(request("/api/votes", body))).status, 401);
  const guestSession = await session(request("/api/session"));
  const cookie = guestSession.headers.get("set-cookie")!.split(";")[0];
  assert.equal(
    (await voteApi(request("/api/votes", body, cookie))).status,
    201,
  );
  assert.equal(
    (await voteApi(request("/api/votes", body, cookie))).status,
    409,
  );
  const stream = await events(request("/api/events"));
  assert.match(stream.headers.get("content-type")!, /event-stream/);
  const reader = stream.body!.getReader();
  const decoder = new TextDecoder();
  async function nextChange() {
    for (let i = 0; i < 8; i++) {
      const chunk = await reader.read();
      if (decoder.decode(chunk.value).includes("event: change")) return;
    }
    throw new Error("No change event received");
  }
  try {
    await nextChange();
    await pollAction(p.id, "close", p.revision);
    await nextChange();
  } finally {
    await reader.cancel();
  }
});
