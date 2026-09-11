"use client";
import { useId, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { Button } from "./ui/button";
import { Media } from "./common";
export function MediaPicker({
  value,
  onChange,
  label,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  label: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(!!value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Images must be 3 MB or smaller.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="media-picker">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ImagePlus size={16} />
        {value ? "Edit image / GIF" : "Add image / GIF"}
      </Button>
      {open && (
        <div className="media-controls">
          <label htmlFor={id}>
            {label} URL
            <input
              id={id}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://… (direct image or GIF URL)"
              type="text"
              maxLength={2048}
            />
          </label>
          <div className="inline">
            <label className="button button-outline upload-button">
              <Upload size={15} />
              {busy ? "Uploading…" : "Upload image"}
              <input
                className="sr-only"
                type="file"
                accept="image/gif,image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
                aria-label={`Upload ${label.toLowerCase()}`}
              />
            </label>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove ${label.toLowerCase()} image`}
                onClick={() => onChange("")}
              >
                <X size={16} />
                Remove
              </Button>
            )}
          </div>
          <p className="field-hint">
            GIF, PNG, JPG, WebP · up to 3 MB. For Giphy or Tenor, paste a direct
            .gif image URL from Share → GIF link.
          </p>
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <Media
            src={value}
            alt={`${label} preview`}
            className="media-preview"
          />
        </div>
      )}
    </div>
  );
}
