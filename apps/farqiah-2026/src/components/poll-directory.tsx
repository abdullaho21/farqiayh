"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CheckCheck,
  Layers,
  Users,
  Vote,
} from "lucide-react";
import type { PollCard } from "@/lib/types";
import { useRemote } from "./app-provider";
import { ErrorState, Loading, StatusBadge } from "./common";
export function PollDirectory() {
  const { data: allPolls, error } = useRemote<PollCard[]>("/api/polls");
  const [filter, setFilter] = useState("active");
  if (error) return <ErrorState error={error} />;
  if (!allPolls) return <Loading />;
  const polls = allPolls.filter((p) => p.status !== "DRAFT");
  const active = polls.filter((p) => ["LIVE", "FINAL"].includes(p.status));
  const ended = polls.filter((p) => ["CLOSED", "PUBLISHED"].includes(p.status));
  const visible = filter === "active" ? active : ended;
  return (
    <div className="directory">
      <div className="page-eyebrow">
        <span className="short-rule" /> THE PEOPLE HAVE A SAY
      </div>
      <div className="page-heading">
        <div>
          <h1>
            A little debate.
            <br />
            <span className="accent">A clear decision.</span>
          </h1>
          <p>Pick a poll. Have your say. See where everyone stands.</p>
        </div>
        <div className="guest-note">
          <span className="guest-note-icon">
            <CheckCheck size={24} />
          </span>
          <div>
            <strong>You’re ready to vote</strong>
            <span>No account needed. Just your opinion.</span>
          </div>
        </div>
      </div>
      <div className="directory-toolbar">
        <div className="segmented" role="group" aria-label="Filter polls">
          <button
            aria-pressed={filter === "active"}
            onClick={() => setFilter("active")}
          >
            Open for voting <span>{active.length}</span>
          </button>
          <button
            aria-pressed={filter === "results"}
            onClick={() => setFilter("results")}
          >
            Results <span>{ended.length}</span>
          </button>
        </div>
        <span className="muted toolbar-note">
          Your vote is part of the conversation.
        </span>
      </div>
      {visible.length ? (
        <div className="poll-grid">
          {visible.map((p, index) => (
            <Link className="poll-card" key={p.id} href={`/polls/${p.id}`}>
              <div className="poll-card-top">
                <StatusBadge status={p.status} />
                <span className="index-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="poll-card-glyph">
                <Vote size={38} strokeWidth={1.4} />
              </div>
              <h2>{p.title}</h2>
              <p>
                {p.description ||
                  "A fresh question for the group. Bring your opinion."}
              </p>
              <div className="poll-card-meta">
                <span>
                  <Layers size={16} />
                  {p.questionCount}{" "}
                  {p.questionCount === 1 ? "question" : "questions"}
                </span>
                <span>
                  <Users size={16} />
                  {p.participants} voted
                </span>
              </div>
              <div className="poll-card-bottom">
                <span>
                  {["LIVE", "FINAL"].includes(p.status)
                    ? "Cast your vote"
                    : "Explore the results"}
                </span>
                <ArrowUpRight size={22} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Vote size={38} />
          <h2>
            {filter === "active"
              ? "The floor is quiet for now."
              : "No results just yet."}
          </h2>
          <p>
            {filter === "active"
              ? "New polls will appear here as soon as they open."
              : "Closed and published polls will appear here."}
          </p>
        </div>
      )}
      <div className="how-it-works">
        <span className="eyebrow">EVERY OPINION COUNTS</span>
        <span>
          <b>01</b> Pick your favorites
        </span>
        <ArrowRight size={16} />
        <span>
          <b>02</b> Follow the live results
        </span>
        <ArrowRight size={16} />
        <span>
          <b>03</b> Vote in the final
        </span>
      </div>
    </div>
  );
}
