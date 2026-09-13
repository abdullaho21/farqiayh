// In-memory UI fixtures only. Production components import the real provider.
import { useSyncExternalStore } from "react";
import type { PollView } from "../../src/lib/types";
let version = 0;
const listeners = new Set<() => void>();
export const requests: { path: string; data: any }[] = [];
export const state = {
  admin: false,
  ready: true,
  sessionError: "",
  poll: {} as PollView,
};
export function reset() {
  requests.length = 0;
  state.admin = false;
  state.ready = true;
  state.sessionError = "";
  state.poll = {
    id: "preview-poll",
    title: "The next game night",
    description: "A poll for your group.",
    status: "LIVE",
    currentRound: 1,
    revision: 1,
    createdAt: "2026-09-12",
    updatedAt: "2026-09-12",
    participants: 0,
    totalVotes: 0,
    rounds: [
      {
        id: "r1",
        number: 1,
        status: "LIVE",
        participants: 0,
        questions: [
          {
            id: "q1",
            title: "What are we playing?",
            type: "SINGLE",
            maxSelections: 1,
            position: 0,
            mediaUrl: null,
            totalBallots: 0,
            myVote: [],
            options: ["Rocket League", "Minecraft", "Something else"].map(
              (label, i) => ({
                id: `game-${i}`,
                label,
                isText: i === 2,
                mediaUrl: null,
                position: i,
                votes: 0,
                percentage: 0,
              }),
            ),
          },
          {
            id: "q2",
            title: "What’s on the snack table?",
            type: "MULTIPLE",
            maxSelections: 2,
            position: 1,
            mediaUrl: null,
            totalBallots: 0,
            myVote: [],
            options: ["Pizza", "Shawarma", "Chips"].map((label, i) => ({
              id: `snack-${i}`,
              label,
              isText: false,
              mediaUrl: null,
              position: i,
              votes: 0,
              percentage: 0,
            })),
          },
        ],
      },
    ],
  };
  refresh();
}
export function refresh() {
  version++;
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function useApp() {
  useSyncExternalStore(
    subscribe,
    () => version,
    () => version,
  );
  return {
    admin: state.admin,
    ready: state.ready,
    sessionError: state.sessionError,
    live: true,
    epoch: version,
    refresh,
    session: async () => refresh(),
  };
}
export function useRemote(path: string | null) {
  useApp();
  if (!path || !state.ready) return { data: null, error: "" };
  return {
    data: path.includes("?id=")
      ? state.poll
      : [
          {
            ...state.poll,
            questionCount: state.poll.rounds[0].questions.length,
          },
        ],
    error: "",
  };
}
export async function api(path: string, data: unknown) {
  requests.push({ path, data });
  return { id: "preview-poll" };
}
