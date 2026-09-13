import { Prisma } from "@prisma/client";
import { db } from "./db";
import { assert, HttpError } from "./http";
import { pollInput, type PollInput, type voteInput } from "./validation";
import type { z } from "zod";
import type { PollCard, PollView } from "./types";
type Tx = Prisma.TransactionClient;
const include = {
  rounds: {
    orderBy: { number: "asc" as const },
    include: {
      questions: {
        orderBy: { position: "asc" as const },
        include: {
          _count: { select: { ballots: true } },
          options: {
            where: { archived: false },
            orderBy: { position: "asc" as const },
            include: { _count: { select: { votes: true } } },
          },
        },
      },
    },
  },
};
async function participants(pollId?: string) {
  return db.$queryRaw<
    { roundId: string; count: number }[]
  >`SELECT q."roundId", COUNT(DISTINCT b."guestHash")::int AS count FROM "Ballot" b JOIN "Question" q ON q.id = b."questionId" JOIN "Round" r ON r.id = q."roundId" WHERE (${pollId ?? null}::text IS NULL OR r."pollId" = ${pollId ?? null}) GROUP BY q."roundId"`;
}
export async function listPolls(admin: boolean): Promise<PollCard[]> {
  const [polls, counts] = await Promise.all([
    db.poll.findMany({
      where: {
        deletedAt: null,
        ...(admin ? {} : { status: { not: "DRAFT" as const } }),
      },
      orderBy: { createdAt: "desc" },
      include,
    }),
    participants(),
  ]);
  return polls.map((p) => {
    const round = p.rounds.find((r) => r.number === p.currentRound)!;
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      currentRound: p.currentRound,
      revision: p.revision,
      createdAt: p.createdAt.toISOString(),
      participants: counts.find((c) => c.roundId === round.id)?.count || 0,
      questionCount: round.questions.length,
      totalVotes: round.questions.reduce(
        (s, q) => s + q.options.reduce((a, o) => a + o._count.votes, 0),
        0,
      ),
    };
  });
}
export async function getPoll(
  id: string,
  guest: string | null,
  admin: boolean,
): Promise<PollView> {
  const p = await db.poll.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(admin ? {} : { status: { not: "DRAFT" as const } }),
    },
    include,
  });
  assert(p, "This poll is unavailable.", 404);
  const [counts, mine, texts] = await Promise.all([
    participants(id),
    guest
      ? db.ballot.findMany({
          where: { guestHash: guest, question: { round: { pollId: id } } },
          select: { questionId: true, votes: { select: { optionId: true } } },
        })
      : [],
    admin
      ? db.textAnswer.findMany({
          where: { ballot: { question: { round: { pollId: id } } } },
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            text: true,
            optionId: true,
            ballot: { select: { questionId: true, displayName: true } },
          },
        })
      : [],
  ]);
  const rounds = p.rounds.map((r) => ({
    id: r.id,
    number: r.number,
    status: r.status,
    participants: counts.find((c) => c.roundId === r.id)?.count || 0,
    questions: r.questions.map((q) => ({
      id: q.id,
      title: q.title,
      mediaUrl: q.mediaUrl,
      type: q.type,
      maxSelections: q.maxSelections,
      position: q.position,
      totalBallots: q._count.ballots,
      myVote:
        mine.find((b) => b.questionId === q.id)?.votes.map((v) => v.optionId) ||
        [],
      options: q.options.map((o) => ({
        id: o.id,
        label: o.label,
        mediaUrl: o.mediaUrl,
        isText: o.isText,
        position: o.position,
        votes: o._count.votes,
        percentage: q._count.ballots
          ? Math.round((o._count.votes / q._count.ballots) * 100)
          : 0,
      })),
      ...(admin
        ? {
            textAnswers: texts
              .filter((t) => t.ballot.questionId === q.id)
              .map((t) => ({
                id: t.id,
                text: t.text,
                optionId: t.optionId,
                displayName: t.ballot.displayName,
              })),
          }
        : {}),
    })),
  }));
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    status: p.status,
    currentRound: p.currentRound,
    revision: p.revision,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    rounds,
    participants:
      rounds.find((r) => r.number === p.currentRound)?.participants || 0,
    totalVotes: rounds
      .flatMap((r) => r.questions)
      .flatMap((q) => q.options)
      .reduce((n, o) => n + o.votes, 0),
  };
}
async function lockPoll(tx: Tx, id: string) {
  await tx.$queryRaw`SELECT id FROM "Poll" WHERE id = ${id} FOR UPDATE`;
  const poll = await tx.poll.findFirst({
    where: { id, deletedAt: null },
    include: {
      rounds: {
        include: {
          questions: {
            include: {
              options: { include: { _count: { select: { votes: true } } } },
              _count: { select: { ballots: true } },
            },
          },
        },
      },
    },
  });
  assert(poll, "Poll not found.", 404);
  return poll;
}
async function touch(
  tx: Tx,
  id: string,
  action: string,
  detail: Prisma.InputJsonValue,
) {
  await tx.poll.update({
    where: { id },
    data: { revision: { increment: 1 }, eventRevision: { increment: 1 } },
  });
  await tx.audit.create({ data: { pollId: id, action, detail } });
}
function editable(status: string) {
  assert(
    status !== "PUBLISHED",
    "Published results are locked. Duplicate the poll to start again.",
    409,
  );
}
function nestedQuestions(data: PollInput["questions"]) {
  return data.map((q, position) => ({
    title: q.title,
    mediaUrl: q.mediaUrl || null,
    type: q.type,
    maxSelections: q.maxSelections,
    position,
    options: {
      create: q.options.map((o, position) => ({
        label: o.label,
        mediaUrl: o.mediaUrl || null,
        isText: o.isText,
        position,
      })),
    },
  }));
}
export async function createPoll(input: PollInput) {
  const data = pollInput.parse(input);
  return db.poll.create({
    data: {
      title: data.title,
      description: data.description,
      rounds: {
        create: {
          number: 1,
          questions: { create: nestedQuestions(data.questions) },
        },
      },
    },
  });
}
export async function savePoll(id: string, input: PollInput, revision: number) {
  const data = pollInput.parse(input);
  return db.$transaction(
    async (tx) => {
      const poll = await lockPoll(tx, id);
      editable(poll.status);
      assert(
        poll.revision === revision,
        "Another admin edit changed this poll. Reload the editor before saving.",
        409,
      );
      const round = poll.rounds.find((r) => r.number === poll.currentRound)!;
      for (const old of round.questions) {
        if (!data.questions.some((q) => q.id === old.id)) {
          assert(
            old._count.ballots === 0,
            "A question with votes cannot be removed. Close or duplicate the poll instead.",
            409,
          );
          await tx.option.deleteMany({ where: { questionId: old.id } });
          await tx.question.delete({ where: { id: old.id } });
        }
      }
      for (const [position, q] of data.questions.entries()) {
        const old = q.id ? round.questions.find((v) => v.id === q.id) : null;
        assert(!q.id || old, "Question does not belong to the active round.");
        const qData = {
          title: q.title,
          mediaUrl: q.mediaUrl || null,
          type: q.type,
          maxSelections: q.maxSelections,
          position,
        };
        if (!old) {
          assert(
            q.options.every((o) => !o.id),
            "New questions cannot reuse option IDs.",
          );
          await tx.question.create({
            data: {
              ...qData,
              roundId: round.id,
              options: { create: nestedQuestions([q])[0].options.create },
            },
          });
          continue;
        }
        const sizes = await tx.$queryRaw<
          { largest: number }[]
        >`SELECT COALESCE(MAX(n), 0)::int AS largest FROM (SELECT COUNT(v.id) AS n FROM "Ballot" b JOIN "Vote" v ON v."ballotId" = b.id WHERE b."questionId" = ${old.id} GROUP BY b.id) counts`;
        const largestBallot = sizes[0].largest;
        assert(
          q.maxSelections >= largestBallot,
          `This question has a ballot with ${largestBallot} selections. Its limit cannot be reduced below that.`,
          409,
        );
        for (const option of old.options.filter((o) => !o.archived))
          if (!q.options.some((o) => o.id === option.id)) {
            assert(
              option._count.votes === 0,
              `“${option.label}” has votes. Use Migrate votes before removing it.`,
              409,
            );
            await tx.option.update({
              where: { id: option.id },
              data: { archived: true },
            });
          }
        await tx.question.update({ where: { id: old.id }, data: qData });
        for (const [position, o] of q.options.entries()) {
          const oldOption = o.id
            ? old.options.find((v) => v.id === o.id && !v.archived)
            : null;
          assert(
            !o.id || oldOption,
            "Option does not belong to this question.",
          );
          assert(
            !oldOption ||
              !oldOption._count.votes ||
              oldOption.isText === o.isText,
            "An option with votes cannot change its answer type. Add a new option and migrate votes.",
            409,
          );
          const oData = {
            label: o.label,
            mediaUrl: o.mediaUrl || null,
            isText: o.isText,
            position,
          };
          if (oldOption)
            await tx.option.update({
              where: { id: oldOption.id },
              data: oData,
            });
          else
            await tx.option.create({ data: { ...oData, questionId: old.id } });
        }
      }
      await tx.poll.update({
        where: { id },
        data: { title: data.title, description: data.description },
      });
      await touch(tx, id, "EDIT", { revision });
    },
    { timeout: 20000 },
  );
}
export async function castVote(
  input: z.infer<typeof voteInput>,
  guestHash: string,
) {
  return db.$transaction(
    async (tx) => {
      const poll = await lockPoll(tx, input.pollId);
      assert(
        poll.status === "LIVE" || poll.status === "FINAL",
        "Voting is closed.",
        409,
      );
      const round = poll.rounds.find((r) => r.number === poll.currentRound)!;
      assert(round.status === "LIVE", "This round is closed.", 409);
      const q = round.questions.find((q) => q.id === input.questionId);
      assert(q, "This question changed. Refresh the poll.", 409);
      assert(
        input.optionIds.length >= 1 &&
          input.optionIds.length <= q.maxSelections,
        `Choose between 1 and ${q.maxSelections} options.`,
      );
      assert(
        new Set(input.optionIds).size === input.optionIds.length,
        "Duplicate selections are not allowed.",
      );
      const selected = input.optionIds.map((id) =>
        q.options.find((o) => o.id === id && !o.archived),
      );
      assert(
        selected.every(Boolean),
        "An option changed. Review your selections and try again.",
        409,
      );
      const textOption = selected.find((o) => o?.isText);
      assert(!textOption || input.text?.trim(), "Enter your text answer.");
      const existing = await tx.ballot.findUnique({
        where: { questionId_guestHash: { questionId: q.id, guestHash } },
      });
      assert(
        !existing,
        "Your vote for this question has already been recorded.",
        409,
      );
      const ballot = await tx.ballot.create({
        data: {
          questionId: q.id,
          guestHash,
          displayName: input.displayName || null,
          votes: { create: input.optionIds.map((optionId) => ({ optionId })) },
          ...(textOption
            ? {
                textAnswers: {
                  create: { optionId: textOption.id, text: input.text!.trim() },
                },
              }
            : {}),
        },
      });
      await tx.poll.update({
        where: { id: poll.id },
        data: { eventRevision: { increment: 1 } },
      });
      return { id: ballot.id };
    },
    { timeout: 15000 },
  );
}
export async function migrateOption(
  id: string,
  sourceId: string,
  targetId: string,
  revision: number,
) {
  return db.$transaction(async (tx) => {
    const poll = await lockPoll(tx, id);
    editable(poll.status);
    assert(
      poll.revision === revision,
      "This poll changed. Reload before migrating votes.",
      409,
    );
    assert(sourceId !== targetId, "Choose a different destination.");
    const round = poll.rounds.find((r) => r.number === poll.currentRound)!;
    const question = round.questions.find((q) =>
      q.options.some((o) => o.id === sourceId && !o.archived),
    );
    assert(question, "Source option is unavailable.");
    const source = question.options.find((o) => o.id === sourceId)!;
    const target = question.options.find(
      (o) => o.id === targetId && !o.archived,
    );
    assert(target, "Choose an active option in the same question.");
    assert(
      !target.isText || source.isText,
      "Votes without text cannot move to a text-answer option.",
    );
    const remaining = question.options.filter(
      (o) => !o.archived && o.id !== sourceId,
    );
    assert(
      remaining.length >= 2,
      "Keep at least two options. Add a replacement first.",
    );
    // A ballot that chose both options becomes one selection for the destination.
    const overlap =
      await tx.$executeRaw`DELETE FROM "Vote" s USING "Vote" t WHERE s."optionId" = ${sourceId} AND t."optionId" = ${targetId} AND s."ballotId" = t."ballotId"`;
    await tx.vote.updateMany({
      where: { optionId: sourceId },
      data: { optionId: targetId },
    });
    await tx.textAnswer.updateMany({
      where: { optionId: sourceId },
      data: { optionId: targetId },
    });
    await tx.option.update({
      where: { id: sourceId },
      data: { archived: true },
    });
    if (question.maxSelections > remaining.length)
      await tx.question.update({
        where: { id: question.id },
        data: { maxSelections: remaining.length },
      });
    await touch(tx, id, "MIGRATE_OPTION", {
      sourceId,
      targetId,
      sourceLabel: source.label,
      targetLabel: target.label,
      sourceVotes: source._count.votes,
      overlappingBallots: overlap,
    });
    return { moved: source._count.votes, overlap };
  });
}
export async function pollAction(
  id: string,
  action: "open" | "close" | "publish" | "duplicate" | "delete",
  revision: number,
) {
  return db.$transaction(async (tx) => {
    const poll = await lockPoll(tx, id);
    assert(
      poll.revision === revision,
      "The poll changed. Refresh and try again.",
      409,
    );
    const round = poll.rounds.find((r) => r.number === poll.currentRound)!;
    if (action === "duplicate") {
      const copy = await tx.poll.create({
        data: {
          title: `${poll.title.slice(0, 150)} (copy)`,
          description: poll.description,
          rounds: {
            create: {
              number: 1,
              questions: {
                create: round.questions.map((q) => ({
                  title: q.title,
                  mediaUrl: q.mediaUrl,
                  type: q.type,
                  maxSelections: q.maxSelections,
                  position: q.position,
                  options: {
                    create: q.options
                      .filter((o) => !o.archived)
                      .map((o) => ({
                        label: o.label,
                        mediaUrl: o.mediaUrl,
                        isText: o.isText,
                        position: o.position,
                      })),
                  },
                })),
              },
            },
          },
        },
      });
      return { id: copy.id };
    }
    if (action === "delete") {
      await tx.poll.update({ where: { id }, data: { deletedAt: new Date() } });
      await touch(tx, id, "DELETE", { archived: true });
      return { id };
    }
    editable(poll.status);
    if (action === "open") {
      assert(
        ["DRAFT", "CLOSED"].includes(poll.status),
        "This round is already open.",
      );
      assert(
        round.questions.length &&
          round.questions.every(
            (q) => q.options.filter((o) => !o.archived).length >= 2,
          ),
        "Every question needs at least two options.",
      );
      await tx.poll.update({
        where: { id },
        data: { status: round.number === 1 ? "LIVE" : "FINAL" },
      });
      await tx.round.update({
        where: { id: round.id },
        data: { status: "LIVE" },
      });
    } else if (action === "close") {
      assert(
        ["LIVE", "FINAL"].includes(poll.status),
        "This round is not live.",
      );
      await tx.poll.update({ where: { id }, data: { status: "CLOSED" } });
      await tx.round.update({
        where: { id: round.id },
        data: { status: "CLOSED" },
      });
    } else if (action === "publish") {
      assert(
        poll.status === "CLOSED" && round.number === 2,
        "Close the final round before publishing results.",
      );
      await tx.poll.update({ where: { id }, data: { status: "PUBLISHED" } });
      await tx.round.update({
        where: { id: round.id },
        data: { status: "PUBLISHED" },
      });
    } else throw new HttpError(400, "Unknown action.");
    await touch(tx, id, action.toUpperCase(), { round: round.number });
    return { id };
  });
}
export async function startFinal(
  id: string,
  selections: Record<string, string[]>,
  revision: number,
) {
  return db.$transaction(async (tx) => {
    const poll = await lockPoll(tx, id);
    assert(
      poll.revision === revision,
      "The poll changed. Reload the finalists before continuing.",
      409,
    );
    assert(
      poll.currentRound === 1 && poll.status === "CLOSED",
      "Close round 1 before starting a final round.",
      409,
    );
    const first = poll.rounds.find((r) => r.number === 1)!;
    assert(
      Object.keys(selections).length === first.questions.length,
      "Choose finalists for every question.",
    );
    const questions = first.questions.map((q) => {
      const ids = selections[q.id];
      assert(
        ids && ids.length >= 2 && new Set(ids).size === ids.length,
        `Choose at least two finalists for “${q.title}”.`,
      );
      const options = ids.map((id) =>
        q.options.find((o) => o.id === id && !o.archived),
      );
      assert(options.every(Boolean), "A selected finalist is unavailable.");
      return {
        sourceId: q.id,
        title: q.title,
        mediaUrl: q.mediaUrl,
        type: q.type,
        maxSelections: Math.min(q.maxSelections, options.length),
        position: q.position,
        options: {
          create: options.map((o, position) => ({
            sourceId: o!.id,
            label: o!.label,
            mediaUrl: o!.mediaUrl,
            isText: o!.isText,
            position,
          })),
        },
      };
    });
    await tx.round.create({
      data: {
        pollId: id,
        number: 2,
        status: "LIVE",
        questions: { create: questions },
      },
    });
    await tx.poll.update({
      where: { id },
      data: { status: "FINAL", currentRound: 2 },
    });
    await touch(tx, id, "START_FINAL", selections);
  });
}
