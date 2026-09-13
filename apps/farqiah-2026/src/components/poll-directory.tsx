"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Layers,
  Search,
  Users,
  Vote,
  X,
  Trophy,
  Radio,
} from "lucide-react";
import type { PollCard } from "@/lib/types";
import { useRemote } from "./app-provider";
import { ErrorState, Loading, StatusBadge } from "./common";
import { Button } from "./ui/button";

export function PollDirectory() {
  const { data: allPolls, error } = useRemote<PollCard[]>("/api/polls");
  const [filter, setFilter] = useState("active");
  const [search, setSearch] = useState("");
  if (error) return <ErrorState error={error} />;
  if (!allPolls) return <Loading />;
  const polls = allPolls.filter((p) => p.status !== "DRAFT");
  const active = polls.filter((p) => ["LIVE", "FINAL"].includes(p.status));
  const ended = polls.filter((p) => ["CLOSED", "PUBLISHED"].includes(p.status));
  const filtered = filter === "active" ? active : ended;
  const visible = filtered.filter((p) =>
    `${p.title} ${p.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <div className="directory">
      <section className="directory-hero" aria-labelledby="welcome-title">
        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="live-dot" /> GOOD COMPANY. BETTER DECISIONS.
          </div>
          <h1 id="welcome-title">
            Less back & forth.
            <br />
            <span>More decided.</span>
          </h1>
          <p>
            For the plans, the favorites, and the friendly debates.
            <br className="desktop-break" /> Bring your opinion. We’ll count it.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <a
                href="#polls"
                onClick={() => {
                  setFilter("active");
                  setSearch("");
                }}
              >
                Find a poll <ArrowUpRight size={19} />
              </a>
            </Button>
            <span>
              <Check size={16} /> No account needed
            </span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-card art-card-back" />
          <div className="art-card art-card-front">
            <div className="art-card-label">
              <Vote size={21} />
              <span>YOUR CALL.</span>
              <ArrowUpRight size={18} />
            </div>
            <div className="art-answer">
              <span />
              <i />
            </div>
            <div className="art-answer art-answer-selected">
              <span>
                <Check size={17} strokeWidth={3} />
              </span>
              <i />
            </div>
            <div className="art-answer">
              <span />
              <i />
            </div>
          </div>
          <div className="art-stamp">
            <Check size={17} /> Every vote counts
          </div>
          <span className="art-spark">✳</span>
        </div>
      </section>
      <section
        id="polls"
        className="directory-section"
        aria-labelledby="polls-title"
      >
        <div className="directory-section-heading">
          <div>
            <span className="eyebrow">THE FLOOR IS YOURS</span>
            <h2 id="polls-title">What are we deciding?</h2>
          </div>
          <span className="directory-live-count">
            <span className="live-dot" /> {active.length}{" "}
            {active.length === 1 ? "poll" : "polls"} open now
          </span>
        </div>
        <div className="directory-toolbar">
          <div className="segmented" role="group" aria-label="Filter polls">
            <button
              aria-pressed={filter === "active"}
              onClick={() => setFilter("active")}
            >
              Open polls <span>{active.length}</span>
            </button>
            <button
              aria-pressed={filter === "results"}
              onClick={() => setFilter("results")}
            >
              Results <span>{ended.length}</span>
            </button>
          </div>
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">Search polls</span>
            <input
              type="search"
              placeholder="Find a poll…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </label>
        </div>
        <p className="sr-only" role="status">
          {visible.length} {visible.length === 1 ? "poll" : "polls"} found
        </p>
        {visible.length ? (
          <div
            className={`poll-grid ${visible.length === 1 ? "single-poll" : ""}`}
          >
            {visible.map((p, index) => (
              <Link
                className={`poll-card card-tone-${index % 3}`}
                style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
                key={p.id}
                href={`/polls/${p.id}`}
              >
                <div className="poll-card-art" aria-hidden="true">
                  <span className="card-orbit" />
                  <span className="poll-card-glyph">
                    {p.status === "FINAL" || p.status === "PUBLISHED" ? (
                      <Trophy size={42} strokeWidth={1.5} />
                    ) : (
                      <Vote size={42} strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="card-round">
                    {p.currentRound === 2 ? "THE FINAL SAY" : "LET’S DECIDE"}
                    <ArrowUpRight size={17} />
                  </span>
                </div>
                <div className="poll-card-content">
                  <div className="poll-card-top">
                    <StatusBadge status={p.status} />
                    <span className="index-number">
                      ROUND {String(p.currentRound).padStart(2, "0")}
                    </span>
                  </div>
                  <h3>{p.title}</h3>
                  <p>
                    {p.description ||
                      "A fresh question for the group. Bring your opinion."}
                  </p>
                  <div className="poll-card-meta">
                    <span>
                      <Layers size={15} />
                      {p.questionCount}{" "}
                      {p.questionCount === 1 ? "question" : "questions"}
                    </span>
                    <span>
                      <Users size={15} />
                      {p.participants} voted
                    </span>
                  </div>
                  <div className="poll-card-bottom">
                    <span>
                      {["LIVE", "FINAL"].includes(p.status)
                        ? "Cast your vote"
                        : "See the results"}
                    </span>
                    <span className="card-arrow">
                      <ArrowRight size={19} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state directory-empty">
            {search ? <Search size={32} /> : <Vote size={32} />}
            <h3>
              {search
                ? "No polls match that search."
                : filter === "active"
                  ? "A little quiet. For now."
                  : "The results are still in the making."}
            </h3>
            <p>
              {search
                ? "Try a different word or clear your search."
                : filter === "active"
                  ? "The next debate is on its way. New polls appear here when they open."
                  : "Come back here for closed polls and the final winners."}
            </p>
            {search && (
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            )}
          </div>
        )}
      </section>
      <section className="how-it-works" aria-label="How voting works">
        <div>
          <span className="how-number">01</span>
          <Vote size={21} />
          <h3>Pick your favorites</h3>
          <p>A quick choice. A written answer. It’s your call.</p>
        </div>
        <div>
          <span className="how-number">02</span>
          <Radio size={21} />
          <h3>Watch it unfold</h3>
          <p>See the group’s votes come in as they happen.</p>
        </div>
        <div>
          <span className="how-number">03</span>
          <Trophy size={21} />
          <h3>Have the final say</h3>
          <p>When the finalists advance, vote for your winner.</p>
        </div>
      </section>
    </div>
  );
}
