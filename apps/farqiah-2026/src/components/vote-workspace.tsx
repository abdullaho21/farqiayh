"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  Loader2,
  Users,
  Vote,
} from "lucide-react";
import { toast } from "sonner";
import type { PollView, QuestionView } from "@/lib/types";
import { api, useApp, useRemote } from "./app-provider";
import { ErrorState, InlineError, Loading, Media, StatusBadge } from "./common";
import { Button } from "./ui/button";
import { QuestionResults, RoundResults } from "./results";
import { SharePoll } from "./share-poll";
type BallotDraft = { selected: string[]; text: string };
const emptyDraft: BallotDraft = { selected: [], text: "" };
function QuestionVote({
  question: q,
  pollId,
  canVote,
  displayName,
  next,
  draft,
  onDraftChange,
  onSubmitted,
  showResults,
  focusOnMount,
}: {
  question: QuestionView;
  pollId: string;
  canVote: boolean;
  displayName: string;
  next?: () => void;
  draft: BallotDraft;
  onDraftChange: (draft: BallotDraft) => void;
  onSubmitted: (ids: string[]) => void;
  showResults: () => void;
  focusOnMount: boolean;
}) {
  const selected = draft.selected
    .filter((id) => q.options.some((option) => option.id === id))
    .slice(0, q.type === "SINGLE" ? 1 : q.maxSelections);
  const { text } = draft;
  const heading = useRef<HTMLHeadingElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useApp();
  const voted = q.myVote.length > 0;
  useEffect(() => {
    if (focusOnMount) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [focusOnMount]);
  function choose(id: string) {
    if (!canVote || voted || busy) return;
    setError("");
    if (q.type === "SINGLE") onDraftChange({ ...draft, selected: [id] });
    else if (selected.includes(id))
      onDraftChange({ ...draft, selected: selected.filter((v) => v !== id) });
    else if (selected.length < q.maxSelections)
      onDraftChange({ ...draft, selected: [...selected, id] });
    else
      setError(
        `You can choose up to ${q.maxSelections} options. Uncheck one to choose another.`,
      );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/votes", {
        pollId,
        questionId: q.id,
        optionIds: selected,
        text,
        displayName,
      });
      onSubmitted(selected);
      refresh();
      toast.success("Your vote is in. Thanks for having a say.");
    } catch (e) {
      setError((e as Error).message);
      refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="voting-columns">
      <section
        className="panel ballot-panel"
        aria-labelledby={`question-${q.id}`}
      >
        <div className="question-mode">
          <Vote size={16} />
          <span>
            {q.type === "SINGLE"
              ? "Choose one"
              : `Choose up to ${q.maxSelections}`}
          </span>
          {voted && (
            <span className="vote-recorded" role="status">
              <CheckCircle2 size={15} />
              Vote recorded
            </span>
          )}
        </div>
        <h2
          className="question-title"
          ref={heading}
          tabIndex={-1}
          id={`question-${q.id}`}
        >
          {q.title}
        </h2>
        <Media src={q.mediaUrl} alt={q.title} className="question-media" />
        <form onSubmit={submit} aria-busy={busy}>
          <fieldset disabled={!canVote || voted || busy}>
            <legend className="sr-only">{q.title}</legend>
            <div
              className={`option-grid ${q.options.some((o) => o.mediaUrl) ? "has-media" : ""}`}
            >
              {q.options.map((o, i) => {
                const checked = voted
                  ? q.myVote.includes(o.id)
                  : selected.includes(o.id);
                return (
                  <label
                    className={`vote-option ${o.mediaUrl ? "has-media" : ""} ${checked ? "is-selected" : ""} ${voted ? "is-recorded" : ""}`}
                    key={o.id}
                  >
                    <input
                      className="sr-only"
                      type={q.type === "SINGLE" ? "radio" : "checkbox"}
                      name={q.id}
                      checked={checked}
                      onChange={() => choose(o.id)}
                    />
                    <div className="option-heading" aria-hidden="true">
                      <span className="option-letter">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span
                        className={`selection-marker ${q.type === "SINGLE" ? "radio-marker" : ""}`}
                      >
                        {checked && <Check size={14} />}
                      </span>
                    </div>
                    <Media src={o.mediaUrl} alt="" className="option-media" />
                    <span className="option-label">{o.label}</span>
                    {o.isText && (
                      <span className="option-hint">Write your answer</span>
                    )}
                  </label>
                );
              })}
            </div>
            {q.options.some((o) => o.isText && selected.includes(o.id)) &&
              !voted && (
                <label className="text-answer-label">
                  Your answer
                  <textarea
                    maxLength={1000}
                    required
                    value={text}
                    onChange={(e) =>
                      onDraftChange({ ...draft, text: e.target.value })
                    }
                    placeholder="Tell us what you have in mind…"
                  />
                </label>
              )}
          </fieldset>
          <InlineError error={error} />
          <div className="ballot-actions">
            {voted ? (
              <>
                <span className="muted">
                  <CheckCircle2 size={17} />
                  Your opinion counts.
                </span>
                <Button onClick={next || showResults} type="button">
                  {next ? "Next question" : "See all results"}{" "}
                  <ArrowRight size={17} />
                </Button>
              </>
            ) : canVote ? (
              <>
                <span
                  className="muted"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {selected.length} / {q.maxSelections} selected
                </span>
                <Button type="submit" disabled={busy || !selected.length}>
                  {busy ? (
                    <>
                      <Loader2 size={17} className="spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      Submit vote <ArrowRight size={17} />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <p className="muted">
                <LockKeyhole size={16} />
                Voting for this round has closed.
              </p>
            )}
          </div>
        </form>
      </section>
      <aside className="panel live-results">
        <div className="panel-heading">
          <h3>
            <BarChart3 size={18} />
            Live results
          </h3>
          <span className="results-live-label">
            <span className="live-dot" /> THIS QUESTION
          </span>
        </div>
        <QuestionResults question={q} />
        <div className="privacy-note">
          <LockKeyhole size={17} />
          <p>
            Your display name and written answers are only visible to the admin.
          </p>
        </div>
      </aside>
    </div>
  );
}
export function VoteWorkspace({ id }: { id: string }) {
  const { data: poll, error } = useRemote<PollView>(
    `/api/polls?id=${encodeURIComponent(id)}`,
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [view, setView] = useState<"vote" | "results">("vote");
  const [displayName, setName] = useState("");
  const [roundNumber, setRoundNumber] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, BallotDraft>>({});
  const [recorded, setRecorded] = useState<Record<string, string[]>>({});
  const [focusBallot, setFocusBallot] = useState(false);
  function goToQuestion(index: number) {
    setFocusBallot(true);
    setQuestionIndex(index);
  }
  useEffect(() => {
    setQuestionIndex(0);
    setRoundNumber(null);
    setView("vote");
    setFocusBallot(false);
    setDrafts({});
    setRecorded({});
  }, [poll?.currentRound]);
  if (error) return <ErrorState error={error} />;
  if (!poll) return <Loading />;
  const round = poll.rounds.find(
    (r) => r.number === (roundNumber || poll.currentRound),
  )!;
  const activeIndex = Math.min(questionIndex, round.questions.length - 1);
  const q = round.questions[activeIndex];
  const canVote =
    round.number === poll.currentRound &&
    ["LIVE", "FINAL"].includes(poll.status);
  const completed = round.questions.filter(
    (q) => q.myVote.length || recorded[q.id]?.length,
  ).length;
  return (
    <div className="poll-workspace">
      <Link className="back-link" href="/">
        <ArrowLeft size={16} />
        All polls
      </Link>
      <div className="poll-title-row">
        <div>
          <div className="inline">
            <StatusBadge status={poll.status} />
            <span className="muted">Round {round.number} of 2</span>
          </div>
          <h1>{poll.title}</h1>
          <p className="page-description">{poll.description}</p>
        </div>
        <div className="poll-heading-tools">
          <SharePoll title={poll.title} />
          <div className="participant-stat">
            <strong>{round.participants}</strong>
            <span>
              <Users size={16} />
              people voted
            </span>
          </div>
        </div>
      </div>
      {poll.status === "FINAL" && (
        <div className="notice">
          <span className="notice-icon">02</span>
          <div>
            <strong>The final is open.</strong>
            <p>A fresh round. A new decision. Vote again for your favorites.</p>
          </div>
        </div>
      )}
      {poll.status === "PUBLISHED" && (
        <div className="notice">
          <CheckCircle2 />
          <div>
            <strong>The results are official.</strong>
            <p>The group has spoken. Explore the winning choices below.</p>
          </div>
        </div>
      )}
      <div className="workspace-toolbar">
        <div className="segmented" role="group" aria-label="Poll view">
          <button
            aria-pressed={view === "vote"}
            onClick={() => setView("vote")}
          >
            Questions <span>{round.questions.length}</span>
          </button>
          <button
            aria-pressed={view === "results"}
            onClick={() => setView("results")}
          >
            Results
          </button>
        </div>
        {poll.rounds.length > 1 && (
          <label className="round-picker">
            Round
            <select
              value={round.number}
              onChange={(e) => {
                setRoundNumber(Number(e.target.value));
                setQuestionIndex(0);
              }}
            >
              <option value={1}>Round 1</option>
              <option value={2}>Final round</option>
            </select>
          </label>
        )}
      </div>
      {view === "vote" ? (
        <>
          <div className="question-navigation" aria-label="Questions">
            {round.questions.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goToQuestion(i)}
                aria-current={item.id === q.id ? "step" : undefined}
              >
                <span>
                  {item.myVote.length || recorded[item.id]?.length ? (
                    <Check size={15} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>{item.title}</span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          {canVote && completed < round.questions.length && (
            <details className="voter-details">
              <summary>
                {displayName
                  ? `Voting as ${displayName}`
                  : "Voting anonymously · Add a name?"}
              </summary>
              <label className="display-name">
                Display name <span>(optional)</span>
                <input
                  value={displayName}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  placeholder="Stay anonymous, or add a name"
                />
              </label>
            </details>
          )}
          <div className="question-progress">
            <span>
              QUESTION{" "}
              {String(
                Math.min(questionIndex + 1, round.questions.length),
              ).padStart(2, "0")}{" "}
              <span className="muted">
                / {String(round.questions.length).padStart(2, "0")}
              </span>
            </span>
            <span className="muted">
              {completed} of {round.questions.length} answered
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Questions answered"
            aria-valuemin={0}
            aria-valuemax={round.questions.length}
            aria-valuenow={completed}
          >
            <span
              style={{
                width: `${(completed / round.questions.length) * 100}%`,
              }}
            />
          </div>
          <QuestionVote
            key={q.id}
            question={{
              ...q,
              myVote: q.myVote.length ? q.myVote : recorded[q.id] || [],
            }}
            pollId={id}
            canVote={canVote}
            displayName={displayName}
            draft={drafts[q.id] || emptyDraft}
            onDraftChange={(draft) =>
              setDrafts((current) => ({ ...current, [q.id]: draft }))
            }
            onSubmitted={(ids) => {
              setRecorded((current) => ({ ...current, [q.id]: ids }));
              setDrafts((current) => ({ ...current, [q.id]: emptyDraft }));
            }}
            focusOnMount={focusBallot}
            showResults={() => setView("results")}
            next={
              activeIndex < round.questions.length - 1
                ? () => goToQuestion(activeIndex + 1)
                : undefined
            }
          />
          <nav className="ballot-pager" aria-label="Move between questions">
            <Button
              variant="ghost"
              disabled={activeIndex === 0}
              onClick={() => goToQuestion(activeIndex - 1)}
            >
              <ArrowLeft size={16} /> Previous
            </Button>
            <span>
              {activeIndex + 1} of {round.questions.length}
            </span>
            <Button
              variant="ghost"
              disabled={activeIndex >= round.questions.length - 1}
              onClick={() => goToQuestion(activeIndex + 1)}
            >
              Next <ArrowRight size={16} />
            </Button>
          </nav>
          {completed === round.questions.length && canVote && (
            <div className="completion">
              <CheckCircle2 />
              <div>
                <strong>You’ve had your say on every question.</strong>
                <p>Stay for the results. They’ll keep updating here.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <RoundResults
          round={round}
          published={poll.status === "PUBLISHED" && round.number === 2}
        />
      )}
    </div>
  );
}
