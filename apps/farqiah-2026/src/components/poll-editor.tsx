"use client";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { pollInput, type PollInput } from "@/lib/validation";
import type { PollView } from "@/lib/types";
import { api } from "./app-provider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { MediaPicker } from "./media-picker";
import { InlineError } from "./common";
const blankQuestion = (): PollInput["questions"][number] => ({
  title: "",
  type: "SINGLE",
  maxSelections: 1,
  options: [
    { label: "", isText: false },
    { label: "", isText: false },
  ],
});
const fromPoll = (p?: PollView): PollInput =>
  p
    ? {
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
              isText: o.isText,
              mediaUrl: o.mediaUrl,
            })),
          })),
      }
    : { title: "", description: "", questions: [blankQuestion()] };
type Migration = {
  sourceId: string;
  sourceLabel: string;
  count: number;
  targets: { id: string; label: string; isText: boolean }[];
  sourceIsText: boolean;
};
export function PollEditor({
  poll,
  saved,
  onDirty,
}: {
  poll?: PollView;
  saved: (id: string) => void;
  onDirty?: (dirty: boolean) => void;
}) {
  const [data, setData] = useState<PollInput>(() => fromPoll(poll));
  const [revision, setRevision] = useState(poll?.revision || 0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [migration, setMigration] = useState<Migration | null>(null);
  const [target, setTarget] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const round = poll?.rounds.find((r) => r.number === poll.currentRound);
  const stale = !!poll && revision !== poll.revision;
  useEffect(() => {
    if (!dirty) {
      setData(fromPoll(poll));
      setRevision(poll?.revision || 0);
    }
  }, [poll?.revision, poll?.id]); // Do not overwrite an unsaved editor with live events.
  useEffect(() => {
    onDirty?.(dirty);
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, onDirty]);
  function change(fn: (draft: PollInput) => void) {
    setData((current) => {
      const next = structuredClone(current);
      fn(next);
      return next;
    });
    setDirty(true);
    setError("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = pollInput.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api<{ id: string }>(
        "/api/admin/polls",
        poll
          ? { action: "save", id: poll.id, revision, data: parsed.data }
          : { action: "create", data: parsed.data },
      );
      setDirty(false);
      onDirty?.(false);
      saved(res.id);
      toast.success(
        poll
          ? "Changes saved. Guests can see the update."
          : "Your draft is ready.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function migrate() {
    if (!poll || !migration) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ moved: number; overlap: number }>(
        "/api/admin/polls",
        {
          action: "migrate",
          id: poll.id,
          revision,
          sourceId: migration.sourceId,
          targetId: target,
        },
      );
      setMigration(null);
      saved(poll.id);
      toast.success(
        `Moved ${result.moved} votes. ${result.overlap} overlapping selections consolidated.`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form onSubmit={submit} className="editor-form">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">THE BIG QUESTION</span>
              <h2>Poll details</h2>
            </div>
            {poll && (
              <span className="saved-state">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </span>
            )}
          </div>
          <div className="stack">
            <label>
              Poll title
              <input
                value={data.title}
                onChange={(e) =>
                  change((d) => {
                    d.title = e.target.value;
                  })
                }
                placeholder="What are we deciding?"
                maxLength={160}
                required
              />
            </label>
            <label>
              Description <span className="optional">(optional)</span>
              <textarea
                value={data.description}
                onChange={(e) =>
                  change((d) => {
                    d.description = e.target.value;
                  })
                }
                placeholder="Give everyone a little context…"
                maxLength={2000}
                rows={2}
              />
            </label>
          </div>
        </div>
        {data.questions.map((q, qi) => (
          <section className="panel editor-question" key={q.id || `new-${qi}`}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  QUESTION {String(qi + 1).padStart(2, "0")}
                </span>
                <h2>{q.title || "Untitled question"}</h2>
              </div>
              <div className="inline">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={qi === 0}
                  aria-label={`Move question ${qi + 1} up`}
                  onClick={() =>
                    change((d) => {
                      [d.questions[qi - 1], d.questions[qi]] = [
                        d.questions[qi],
                        d.questions[qi - 1],
                      ];
                    })
                  }
                >
                  <ArrowUp size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={qi === data.questions.length - 1}
                  aria-label={`Move question ${qi + 1} down`}
                  onClick={() =>
                    change((d) => {
                      [d.questions[qi + 1], d.questions[qi]] = [
                        d.questions[qi],
                        d.questions[qi + 1],
                      ];
                    })
                  }
                >
                  <ArrowDown size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove question ${qi + 1}`}
                  disabled={
                    data.questions.length === 1 ||
                    !!round?.questions.find((v) => v.id === q.id)?.totalBallots
                  }
                  onClick={() =>
                    change((d) => {
                      d.questions.splice(qi, 1);
                    })
                  }
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            <label>
              Question text
              <input
                required
                value={q.title}
                maxLength={300}
                onChange={(e) =>
                  change((d) => {
                    d.questions[qi].title = e.target.value;
                  })
                }
                placeholder="Ask something worth deciding"
              />
            </label>
            <MediaPicker
              value={q.mediaUrl}
              label={`Question ${qi + 1}`}
              onChange={(url) =>
                change((d) => {
                  d.questions[qi].mediaUrl = url;
                })
              }
            />
            <div className="question-settings">
              <label>
                Answer type
                <select
                  value={q.type}
                  onChange={(e) =>
                    change((d) => {
                      d.questions[qi].type = e.target.value as
                        "SINGLE" | "MULTIPLE";
                      d.questions[qi].maxSelections =
                        e.target.value === "SINGLE"
                          ? 1
                          : Math.min(2, q.options.length);
                    })
                  }
                >
                  <option value="SINGLE">Single choice</option>
                  <option value="MULTIPLE">Multiple choice</option>
                </select>
              </label>
              <label>
                Maximum selections
                <input
                  type="number"
                  min={1}
                  max={q.options.length}
                  disabled={q.type === "SINGLE"}
                  value={q.maxSelections}
                  onChange={(e) =>
                    change((d) => {
                      d.questions[qi].maxSelections = Number(e.target.value);
                    })
                  }
                />
              </label>
            </div>
            <div className="section-label">
              <h3>Answer options</h3>
              <span className="muted">{q.options.length} options</span>
            </div>
            <div className="editor-options">
              {q.options.map((o, oi) => {
                const original = round?.questions
                  .find((v) => v.id === q.id)
                  ?.options.find((v) => v.id === o.id);
                return (
                  <div className="editor-option" key={o.id || `new-${oi}`}>
                    <div className="editor-option-main">
                      <span className="option-letter">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <label className="option-input">
                        <span className="sr-only">
                          Question {qi + 1}, option {oi + 1}
                        </span>
                        <input
                          value={o.label}
                          maxLength={200}
                          required
                          onChange={(e) =>
                            change((d) => {
                              d.questions[qi].options[oi].label =
                                e.target.value;
                            })
                          }
                          placeholder={
                            o.isText ? "Something else…" : `Option ${oi + 1}`
                          }
                        />
                      </label>
                      <div className="option-reorder">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Move option ${oi + 1} up`}
                          disabled={oi === 0}
                          onClick={() =>
                            change((d) => {
                              const opts = d.questions[qi].options;
                              [opts[oi - 1], opts[oi]] = [
                                opts[oi],
                                opts[oi - 1],
                              ];
                            })
                          }
                        >
                          <ArrowUp size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Move option ${oi + 1} down`}
                          disabled={oi === q.options.length - 1}
                          onClick={() =>
                            change((d) => {
                              const opts = d.questions[qi].options;
                              [opts[oi + 1], opts[oi]] = [
                                opts[oi],
                                opts[oi + 1],
                              ];
                            })
                          }
                        >
                          <ArrowDown size={14} />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove option ${oi + 1}`}
                        disabled={q.options.length <= 2 || !!original?.votes}
                        onClick={() =>
                          change((d) => {
                            d.questions[qi].options.splice(oi, 1);
                            d.questions[qi].maxSelections = Math.min(
                              d.questions[qi].maxSelections,
                              d.questions[qi].options.length,
                            );
                          })
                        }
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    <div className="editor-option-details">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={o.isText}
                          disabled={
                            !!original?.votes ||
                            (!o.isText && q.options.some((v) => v.isText))
                          }
                          onChange={(e) =>
                            change((d) => {
                              d.questions[qi].options[oi].isText =
                                e.target.checked;
                            })
                          }
                        />
                        Let guests write an answer
                      </label>
                      {original && (
                        <span className="muted">{original.votes} votes</span>
                      )}
                      {original && original.votes > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={dirty || stale}
                          title={
                            dirty
                              ? "Save changes before migrating votes"
                              : "Merge or replace this option"
                          }
                          onClick={() => {
                            setTarget("");
                            setConfirmed(false);
                            setError("");
                            setMigration({
                              sourceId: original.id,
                              sourceLabel: original.label,
                              sourceIsText: original.isText,
                              count: original.votes,
                              targets: round!.questions
                                .find((v) => v.id === q.id)!
                                .options.filter((v) => v.id !== o.id),
                            });
                          }}
                        >
                          <ArrowRightLeft size={14} />
                          Migrate votes
                        </Button>
                      )}
                    </div>
                    <MediaPicker
                      label={`Option ${oi + 1}`}
                      value={o.mediaUrl}
                      onChange={(url) =>
                        change((d) => {
                          d.questions[qi].options[oi].mediaUrl = url;
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              className="add-option"
              disabled={q.options.length >= 50}
              onClick={() =>
                change((d) => {
                  d.questions[qi].options.push({ label: "", isText: false });
                })
              }
            >
              <Plus size={16} />
              Add option
            </Button>
          </section>
        ))}
        <Button
          type="button"
          variant="outline"
          className="add-question"
          disabled={data.questions.length >= 30}
          onClick={() =>
            change((d) => {
              d.questions.push(blankQuestion());
            })
          }
        >
          <Plus size={18} />
          Add question
        </Button>
        <div className="editor-save-bar">
          <div>
            {stale ? (
              <p className="error-message">
                Another admin changed this poll. Reload the editor to continue.
              </p>
            ) : (
              <p className="muted">
                {poll?.status === "LIVE" || poll?.status === "FINAL"
                  ? "Changes appear live. Existing votes stay attached to their options."
                  : "Create your questions, then open the poll when you’re ready."}
              </p>
            )}
            <InlineError error={migration ? "" : error} />
          </div>
          {stale && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (dirty) {
                  setError(
                    "Copy any unsaved changes before reloading. Click “Discard & reload” below.",
                  );
                  return;
                }
                setData(fromPoll(poll));
                setRevision(poll!.revision);
              }}
            >
              Reload editor
            </Button>
          )}
          {stale && dirty && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDirty(false);
                setData(fromPoll(poll));
                setRevision(poll!.revision);
                setError("");
              }}
            >
              Discard & reload
            </Button>
          )}
          <Button type="submit" disabled={busy || stale}>
            <Save size={17} />
            {busy ? "Saving…" : poll ? "Save changes" : "Create draft"}
          </Button>
        </div>
      </form>
      <Dialog
        open={!!migration}
        onOpenChange={(open) => {
          if (!busy && !open) {
            setMigration(null);
            setError("");
          }
        }}
      >
        <DialogContent>
          <DialogTitle className="dialog-title">
            Migrate existing votes
          </DialogTitle>
          <DialogDescription className="muted">
            Move {migration?.count} votes from “{migration?.sourceLabel}” to
            another option. The original option will be archived.
          </DialogDescription>
          <div className="stack">
            <label>
              Move votes to
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Choose a destination</option>
                {migration?.targets.map((o) => (
                  <option
                    key={o.id}
                    value={o.id}
                    disabled={o.isText && !migration.sourceIsText}
                  >
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="notice compact">
              <p>
                If someone selected both options, their ballot will count once
                for the destination. Every written answer is retained. The
                migration is recorded in the audit log.
              </p>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I understand how existing votes will move.
            </label>
            <InlineError error={error} />
            <Button disabled={!target || !confirmed || busy} onClick={migrate}>
              {busy ? "Moving votes…" : "Move votes & archive option"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
