"use client";
import { useEffect, useState } from "react";
import { AlertCircle, ImageOff, Radio, Trophy } from "lucide-react";
import { useApp } from "./app-provider";
import { Button } from "./ui/button";
import type { Status } from "@/lib/types";
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {status === "LIVE" || status === "FINAL" ? (
        <Radio size={13} />
      ) : status === "PUBLISHED" ? (
        <Trophy size={13} />
      ) : null}
      {
        {
          DRAFT: "Draft",
          LIVE: "Live now",
          CLOSED: "Closed",
          FINAL: "Final round",
          PUBLISHED: "Published",
        }[status]
      }
    </span>
  );
}
export function Media({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src) return null;
  return failed ? (
    <div
      className={`media-fallback ${className}`}
      role="img"
      aria-label={alt ? `${alt}: image unavailable` : "Image unavailable"}
    >
      <ImageOff size={24} />
      <span>Image unavailable</span>
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`media ${className}`}
      onError={() => setFailed(true)}
      referrerPolicy="no-referrer"
    />
  );
}
export function Loading() {
  const { sessionError, session } = useApp();
  return sessionError ? (
    <div className="empty-state">
      <AlertCircle />
      <h2>Unable to connect</h2>
      <p>{sessionError}</p>
      <Button onClick={() => void session()}>Try again</Button>
    </div>
  ) : (
    <div
      className="loading-skeleton"
      role="status"
      aria-label="Loading your polls"
    >
      <div className="skeleton-heading" aria-hidden="true">
        <span className="skeleton skeleton-eyebrow" />
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-subtitle" />
      </div>
      <div className="skeleton-grid" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div className="skeleton-card" key={i}>
            <div className="skeleton skeleton-art" />
            <div className="skeleton-card-copy">
              <span className="skeleton skeleton-eyebrow" />
              <span className="skeleton skeleton-title" />
              <span className="skeleton skeleton-subtitle" />
            </div>
          </div>
        ))}
      </div>
      <span className="loading-caption">Getting the conversation ready…</span>
    </div>
  );
}
export function ErrorState({ error }: { error: string }) {
  const { refresh, session } = useApp();
  return (
    <div className="empty-state" role="alert">
      <AlertCircle />
      <h2>We couldn’t load this</h2>
      <p>{error}</p>
      <Button
        onClick={() => {
          refresh();
          void session();
        }}
      >
        Try again
      </Button>
    </div>
  );
}
export function InlineError({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="error-message">
      {error}
    </p>
  ) : null;
}
