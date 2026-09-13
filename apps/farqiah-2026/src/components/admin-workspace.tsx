"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  LockKeyhole,
  Play,
  Send,
  Trash2,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import type { PollView } from "@/lib/types";
import { api, useApp, useRemote } from "./app-provider";
import { AdminGate } from "./admin-dashboard";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { ErrorState, InlineError, Loading, StatusBadge } from "./common";
import { PollEditor } from "./poll-editor";
import { FinalDialog } from "./final-dialog";
import { RoundResults } from "./results";
function Workspace({ id }: { id: string }) {
  const isNew = id === "new";
  const router = useRouter();
  const { refresh } = useApp();
  const { data: poll, error } = useRemote<PollView>(
    isNew ? null : `/api/polls?id=${encodeURIComponent(id)}`,
  );
  const [view, setView] = useState<"edit" | "results">("edit");
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState<"close" | "publish" | "delete" | null>(
    null,
  );
  const [final, setFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [resultsRound, setResultsRound] = useState<number | null>(null);
  function saved(pollId: string) {
    if (isNew) router.replace(`/admin/${pollId}`);
    refresh();
  }
  async function action(
    type: "open" | "close" | "publish" | "duplicate" | "delete",
  ) {
    if (!poll) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await api<{ id: string }>("/api/admin/polls", {
        action: type,
        id: poll.id,
        revision: poll.revision,
      });
      setConfirm(null);
      refresh();
      if (type === "delete") router.push("/admin");
      else if (type === "duplicate") router.push(`/admin/${result.id}`);
      toast.success(
        {
          open: "Voting is open.",
          close: "Voting is closed.",
          publish: "Final results are published.",
          duplicate: "Poll duplicated as a new draft.",
          delete: "Poll removed. Its voting records are retained.",
        }[type],
      );
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorState error={error} />;
  if (!isNew && !poll) return <Loading />;
  return (
    <div className="admin-workspace">
      <Link href="/admin" className="back-link">
        <ArrowLeft size={16} />
        Admin Dashboard
      </Link>
      <div className="admin-heading">
        <div>
          <div className="inline">
            {poll && <StatusBadge status={poll.status} />}
            <span className="eyebrow">
              {isNew
                ? "NEW POLL"
                : `ROUND ${poll!.currentRound} · CONTROL ROOM`}
            </span>
          </div>
          <h1>{isNew ? "Make room for opinions." : poll!.title}</h1>
        </div>
        {poll && (
          <Button variant="outline" asChild>
            <Link href={`/polls/${id}`} target="_blank">
              Guest view <ExternalLink size={15} />
            </Link>
          </Button>
        )}
      </div>
      {poll && (
        <>
          <div className="admin-actions">
            {["DRAFT", "CLOSED"].includes(poll.status) && (
              <Button disabled={busy || dirty} onClick={() => action("open")}>
                <Play size={16} />
                {poll.status === "DRAFT" ? "Open voting" : "Reopen round"}
              </Button>
            )}
            {["LIVE", "FINAL"].includes(poll.status) && (
              <Button
                disabled={busy || dirty}
                variant="outline"
                onClick={() => {
                  setActionError("");
                  setConfirm("close");
                }}
              >
                <LockKeyhole size={16} />
                Close voting
              </Button>
            )}
            {poll.status === "CLOSED" && poll.currentRound === 1 && (
              <Button disabled={dirty} onClick={() => setFinal(true)}>
                <Trophy size={16} />
                Start final round
              </Button>
            )}
            {poll.status === "CLOSED" && poll.currentRound === 2 && (
              <Button
                disabled={busy || dirty}
                onClick={() => {
                  setActionError("");
                  setConfirm("publish");
                }}
              >
                <Send size={16} />
                Publish final results
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={busy || dirty}
              onClick={() => action("duplicate")}
            >
              <Copy size={16} />
              Duplicate
            </Button>
            <Button
              variant="ghost"
              disabled={busy || dirty}
              onClick={() => {
                setActionError("");
                setConfirm("delete");
              }}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
          {dirty && (
            <p className="field-hint">
              Save your changes before changing the poll’s status, duplicating,
              or migrating votes.
            </p>
          )}
          {!confirm && <InlineError error={actionError} />}
          <div className="workspace-toolbar">
            <div className="segmented" role="group" aria-label="Admin view">
              {poll.status !== "PUBLISHED" && (
                <button
                  aria-pressed={view === "edit"}
                  onClick={() => setView("edit")}
                >
                  Questions & options
                </button>
              )}
              <button
                aria-pressed={view === "results" || poll.status === "PUBLISHED"}
                onClick={() => setView("results")}
              >
                Live results <span>{poll.participants}</span>
              </button>
            </div>
            {(view === "results" || poll.status === "PUBLISHED") &&
              poll.rounds.length > 1 && (
                <label className="round-picker">
                  Round
                  <select
                    value={resultsRound || poll.currentRound}
                    onChange={(e) => setResultsRound(Number(e.target.value))}
                  >
                    <option value={1}>Round 1</option>
                    <option value={2}>Final round</option>
                  </select>
                </label>
              )}
          </div>
        </>
      )}
      {/* Keep the editor mounted when switching tabs so unsaved edits survive. */}
      {(isNew || poll?.status !== "PUBLISHED") && (
        <div hidden={!isNew && view !== "edit"}>
          <PollEditor
            key={id}
            poll={poll || undefined}
            saved={saved}
            onDirty={setDirty}
          />
        </div>
      )}
      {poll && (view === "results" || poll.status === "PUBLISHED") && (
        <RoundResults
          round={poll.rounds.find(
            (r) => r.number === (resultsRound || poll.currentRound),
          )!}
          published={
            poll.status === "PUBLISHED" &&
            (resultsRound || poll.currentRound) === 2
          }
          admin
        />
      )}
      {final && poll && (
        <FinalDialog
          poll={poll}
          close={() => setFinal(false)}
          saved={refresh}
        />
      )}
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setConfirm(null);
            setActionError("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle className="dialog-title">
            {confirm === "delete"
              ? "Remove this poll?"
              : confirm === "publish"
                ? "Publish the final results?"
                : "Close this round?"}
          </DialogTitle>
          <DialogDescription className="muted">
            {confirm === "delete"
              ? "The poll will disappear for guests and admins. All votes, written answers, and audit records will be retained in the database."
              : confirm === "publish"
                ? "The final leaderboard will become official. Published polls cannot be edited or reopened."
                : "New votes will stop immediately. You can reopen this round or move on to the next step."}
          </DialogDescription>
          <InlineError error={actionError} />
          <div className="dialog-actions">
            <Button
              variant="outline"
              onClick={() => setConfirm(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant={confirm === "delete" ? "destructive" : "default"}
              disabled={busy}
              onClick={() => confirm && action(confirm)}
            >
              {busy
                ? "Working…"
                : confirm === "delete"
                  ? "Remove poll"
                  : confirm === "publish"
                    ? "Publish results"
                    : "Close voting"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function AdminWorkspace({ id }: { id: string }) {
  return (
    <AdminGate>
      <Workspace key={id} id={id} />
    </AdminGate>
  );
}
