"use client";
import { Trophy } from "lucide-react";
import type { QuestionView, RoundView } from "@/lib/types";
export function QuestionResults({
  question,
  published = false,
}: {
  question: QuestionView;
  published?: boolean;
}) {
  const ranked = [...question.options].sort(
    (a, b) => b.votes - a.votes || a.position - b.position,
  );
  const highest = ranked[0]?.votes || 0;
  return (
    <div className="result-list">
      {ranked.map((o, i) => (
        <div
          key={o.id}
          className={`result-row ${o.votes && o.votes === highest ? "result-leading" : ""}`}
        >
          <span className="rank">{String(i + 1).padStart(2, "0")}</span>
          <div className="result-content">
            <div className="result-label">
              <span>
                {o.label}
                {o.votes > 0 && o.votes === highest && (
                  <span className="leader-tag">
                    <Trophy size={12} />
                    {published ? "Winner" : "Leading"}
                  </span>
                )}
              </span>
              <strong>{o.percentage}%</strong>
            </div>
            <div className="result-track">
              <div style={{ width: `${o.percentage}%` }} />
            </div>
            <span className="result-votes">
              {o.votes} {o.votes === 1 ? "vote" : "votes"}
            </span>
          </div>
        </div>
      ))}
      <p className="result-footnote">
        {question.totalBallots}{" "}
        {question.totalBallots === 1 ? "person voted" : "people voted"}
        {question.type === "MULTIPLE"
          ? " · Multiple choice: percentages may total over 100%."
          : ""}
      </p>
    </div>
  );
}
export function RoundResults({
  round,
  published = false,
  admin = false,
}: {
  round: RoundView;
  published?: boolean;
  admin?: boolean;
}) {
  return (
    <div className="stack">
      {round.questions.map((q, i) => (
        <section className="panel" key={q.id}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                QUESTION {String(i + 1).padStart(2, "0")}
              </span>
              <h2>{q.title}</h2>
            </div>
          </div>
          <QuestionResults question={q} published={published} />
          {admin && !!q.textAnswers?.length && (
            <details className="text-responses">
              <summary>Written answers · recent submissions</summary>
              <p className="muted">
                Visible only to admins. Showing up to 200 recent answers across
                this poll.
              </p>
              {q.textAnswers.map((a) => (
                <blockquote key={a.id}>
                  <p>{a.text}</p>
                  <cite>
                    {a.displayName || "Anonymous"} ·{" "}
                    {q.options.find((o) => o.id === a.optionId)?.label ||
                      "Migrated option"}
                  </cite>
                </blockquote>
              ))}
            </details>
          )}
        </section>
      ))}
    </div>
  );
}
