"use client";
import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

export function SharePoll({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function share() {
    const link = `${window.location.origin}${window.location.pathname}`;
    setUrl(link);
    setCopied(false);
    setCopyError(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: "Have your say on Farqiah 2026.",
          url: link,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    setOpen(true);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <>
      <Button variant="outline" onClick={share}>
        <Share2 size={16} /> Share poll
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="dialog-symbol">
            <Share2 />
          </div>
          <DialogTitle className="dialog-title">
            Better with everyone.
          </DialogTitle>
          <DialogDescription className="muted">
            Send this link to your group. They can vote straight away, without
            an account.
          </DialogDescription>
          <label>
            Poll link
            <input value={url} readOnly onFocus={(e) => e.target.select()} />
          </label>
          <p className="field-hint" role="status">
            {copyError
              ? "Select the link above, then use your device’s Copy option."
              : copied
                ? "Link copied. Ready for your group chat."
                : "Anyone with the link can open this poll."}
          </p>
          <div className="dialog-actions">
            <Button onClick={copy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
