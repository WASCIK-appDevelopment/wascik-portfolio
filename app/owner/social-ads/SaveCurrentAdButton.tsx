"use client";

import { useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";

type Props = {
  brand: string;
  productOrService: string;
  platform: string;
  headline?: string;
  primaryCopy?: string;
  cta?: string;
  salesLine?: string;
  hashtags?: string[];
};

export default function SaveCurrentAdButton({ brand, productOrService, platform, headline = "", primaryCopy = "", cta = "", salesLine = "", hashtags = [] }: Props) {
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function save() {
    if (saving) return;
    setError("");
    setNotice("");
    const canvas = Array.from(document.querySelectorAll("canvas")).find((item) => item.width > 0 && item.height > 0);
    if (!canvas) {
      setError("Generate and preview the photo ad first, then save it to My Ad Library.");
      return;
    }

    setSaving(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not prepare the finished ad image.")), "image/png", 1));
      const form = new FormData();
      form.append("file", blob, "wascik-finished-ad.png");
      form.append("title", `${brand} — ${productOrService}`);
      form.append("brand", brand);
      form.append("productOrService", productOrService);
      form.append("platform", platform);
      form.append("headline", headline);
      form.append("primaryCopy", primaryCopy);
      form.append("cta", cta);
      form.append("salesLine", salesLine);
      form.append("hashtags", JSON.stringify(hashtags));

      const key = sessionStorage.getItem(SESSION_KEY) || "";
      const response = await fetch("/api/owner/ad-library", { method: "POST", headers: { "x-wascik-owner-key": key }, body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save this ad.");
      setNotice("Saved permanently to My Ad Library.");
      window.dispatchEvent(new Event("wascik-ad-library-updated"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this ad.");
    } finally {
      setSaving(false);
    }
  }

  return <div style={{ display: "grid", gap: 5 }}>
    <button type="button" onClick={() => void save()} disabled={saving} style={{ border: "1px solid rgba(143,240,184,.38)", borderRadius: 11, background: "rgba(143,240,184,.08)", color: "#8ff0b8", padding: "10px 12px", fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .65 : 1 }}>{saving ? "Saving…" : "Save to My Ad Library"}</button>
    {notice ? <span style={{ color: "#8ff0b8", fontSize: 11 }}>{notice}</span> : null}
    {error ? <span style={{ color: "#ff9f9f", fontSize: 11 }}>{error}</span> : null}
  </div>;
}
