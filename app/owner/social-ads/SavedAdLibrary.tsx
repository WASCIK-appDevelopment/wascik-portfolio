"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";

type SavedAd = {
  id: string;
  title: string;
  brand: string;
  productOrService: string;
  platform: string;
  headline?: string;
  primaryCopy?: string;
  cta?: string;
  salesLine?: string;
  hashtags?: string[];
  createdAt?: string;
  imageUrl: string;
};

export default function SavedAdLibrary() {
  const [ads, setAds] = useState<SavedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    if (!key) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/ad-library", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load My Ad Library.");
      setAds(Array.isArray(data.ads) ? data.ads : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load My Ad Library.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("wascik-ad-library-updated", refresh);
    return () => window.removeEventListener("wascik-ad-library-updated", refresh);
  }, []);

  async function remove(id: string) {
    if (!window.confirm("Delete this saved ad from My Ad Library?")) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    const response = await fetch(`/api/owner/ad-library?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { "x-wascik-owner-key": key } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "Could not delete the saved ad.");
      return;
    }
    setAds((current) => current.filter((ad) => ad.id !== id));
  }

  function download(ad: SavedAd) {
    const anchor = document.createElement("a");
    anchor.href = ad.imageUrl;
    anchor.download = `${ad.brand}-${ad.productOrService}-${ad.platform}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 100) + ".png";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function copyPackage(ad: SavedAd) {
    const text = [
      `${ad.brand} — ${ad.productOrService}`,
      ad.platform ? `Platform: ${ad.platform}` : "",
      ad.headline ? `Headline: ${ad.headline}` : "",
      ad.primaryCopy ? `Ad copy:\n${ad.primaryCopy}` : "",
      ad.cta ? `CTA: ${ad.cta}` : "",
      ad.salesLine ? `Sales line:\n${ad.salesLine}` : "",
      ad.hashtags?.length ? `Hashtags: ${ad.hashtags.join(" ")}` : "",
    ].filter(Boolean).join("\n\n");
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  return <section style={{ border: "1px solid rgba(143,240,184,.24)", borderRadius: 16, padding: 14, background: "rgba(143,240,184,.035)" }}>
    <button type="button" onClick={() => setOpen((value) => !value)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: 0, background: "transparent", color: "#eef8ff", padding: 0, textAlign: "left", cursor: "pointer" }}>
      <span><span style={{ display: "block", color: "#8ff0b8", fontSize: 11, fontWeight: 950, letterSpacing: ".12em" }}>MY AD LIBRARY</span><strong style={{ display: "block", marginTop: 4, fontSize: 18 }}>Saved finished ads ({ads.length})</strong></span>
      <span style={{ color: "#8ff0b8", fontSize: 20 }}>{open ? "⌃" : "⌄"}</span>
    </button>
    {open ? <div style={{ marginTop: 13 }}>
      {loading ? <div style={{ color: "#8ff0b8" }}>Loading saved ads…</div> : null}
      {error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}
      {!loading && !error && !ads.length ? <div style={{ color: "#91a8b7", fontSize: 13 }}>No saved ads yet. Finish a photo ad and tap “Save to My Ad Library.”</div> : null}
      {ads.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
        {ads.map((ad) => <article key={ad.id} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 13, padding: 9, background: "rgba(255,255,255,.025)" }}>
          <img src={ad.imageUrl} alt={ad.title} style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", borderRadius: 10, background: "#06111b" }} />
          <div style={{ marginTop: 8, color: "#71dcff", fontSize: 11, fontWeight: 900 }}>{ad.brand}</div>
          <div style={{ marginTop: 3, fontWeight: 850 }}>{ad.productOrService}</div>
          <div style={{ marginTop: 3, color: "#91a8b7", fontSize: 11 }}>{ad.platform}{ad.createdAt ? ` · ${new Date(ad.createdAt).toLocaleDateString()}` : ""}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 9 }}>
            <button type="button" onClick={() => download(ad)} style={{ border: "1px solid rgba(113,220,255,.3)", borderRadius: 9, background: "rgba(113,220,255,.07)", color: "#71dcff", padding: "7px 8px", fontWeight: 800, fontSize: 11 }}>Download</button>
            <button type="button" onClick={() => void copyPackage(ad)} style={{ border: "1px solid rgba(143,240,184,.3)", borderRadius: 9, background: "rgba(143,240,184,.06)", color: "#8ff0b8", padding: "7px 8px", fontWeight: 800, fontSize: 11 }}>Copy Copy</button>
          </div>
          <button type="button" onClick={() => void remove(ad.id)} style={{ width: "100%", marginTop: 6, border: 0, background: "transparent", color: "#ffaaaa", padding: "5px 0", fontSize: 11 }}>Delete from library</button>
        </article>)}
      </div> : null}
    </div> : null}
  </section>;
}
