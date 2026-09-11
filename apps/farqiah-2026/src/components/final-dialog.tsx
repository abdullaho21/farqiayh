"use client";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { toast } from "sonner";
import type { PollView } from "@/lib/types";
import { api } from "./app-provider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { InlineError } from "./common";
export function FinalDialog({
  poll,
  close,
  saved,
}: {
  poll: PollView;
  close: () => void;
  saved: () => void;
}) {
  const round = poll.rounds.find((r) => r.number === 1)!;
  const ranked = round.questions.map((q) => ({
    ...q,
    options: [...q.options].sort(
      (a, b) => b.votes - a.votes || a.position - b.position,
    ),
  }));
  const [selections, setSelections] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(
      ranked.map((q) => [q.id, q.options.slice(0, 2).map((o) => o.id)]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/polls", {
        action: "final",
        id: poll.id,
        revision: poll.revision,
        selections,
      });
      saved();
      close();
      toast.success("The final round is live. Everyone can vote again.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <DialogContent className="dialog-wide">
        <div className="dialog-symbol">
          <Trophy />
        </div>
        <DialogTitle className="dialog-title">Choose the finalists</DialogTitle>
        <DialogDescription className="muted">
          Round 1 is ranked below. Choose at least two options per question.
          Ties stay in the original order; you decide who advances.
        </DialogDescription>
        <div className="finalist-questions">
          {ranked.map((q) => (
            <section className="finalist-question" key={q.id}>
              <div className="section-label">
                <h3>{q.title}</h3>
                <div className="inline">
                  {[2, 4].map((n) => (
                    <Button
                      variant="outline"
                      size="sm"
                      key={n}
                      onClick={() =>
                        setSelections((v) => ({
                          ...v,
                          [q.id]: q.options.slice(0, n).map((o) => o.id),
                        }))
                      }
                    >
                      Top {n}
                    </Button>
                  ))}
                </div>
              </div>
              {q.options.map((o, i) => (
                <label className="finalist-option" key={o.id}>
                  <input
                    type="checkbox"
                    checked={selections[q.id].includes(o.id)}
                    onChange={(e) =>
                      setSelections((v) => ({
                        ...v,
                        [q.id]: e.target.checked
                          ? [...v[q.id], o.id]
                          : v[q.id].filter((id) => id !== o.id),
                      }))
                    }
                  />
                  <span className="rank">{i + 1}</span>
                  <span>{o.label}</span>
                  <strong>{o.votes} votes</strong>
                </label>
              ))}
              <p className="field-hint">
                {selections[q.id].length} finalists selected
              </p>
            </section>
          ))}
        </div>
        <InlineError error={error} />
        <Button
          className="full-width"
          disabled={busy || Object.values(selections).some((v) => v.length < 2)}
          onClick={start}
        >
          <Trophy size={17} />
          {busy ? "Starting final…" : "Start final voting"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
