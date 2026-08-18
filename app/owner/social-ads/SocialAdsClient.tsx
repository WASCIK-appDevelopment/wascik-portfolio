"use client";

import { useMemo, useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";

type DraftResult = {
  primaryCopy?: string;
  headline?: string;
  cta?: string;
  hashtags?: string[];
  complianceNotes?: string[];
};

const platforms = ["Facebook", "Instagram", "TikTok", "Threads", "X", "YouTube", "General social post"];

export default function SocialAdsClient() {
  const [platform, setPlatform] = useState("Facebook");
  const [merchant, setMerchant] = useState("");
  const [product, setProduct] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [objective, setObjective] = useState("Drive product interest and affiliate clicks");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canGenerate = useMemo(() => Boolean(platform && merchant.trim() && product.trim() && !loading), [platform, merchant, product, loading]);

  async function generate() {
    if (!canGenerate) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/owner/social-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ platform, merchant, product, affiliateUrl, objective, notes }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate content.");
      setResult(data as DraftResult);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate content.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  const fieldStyle = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 16 } as const;
  const labelStyle = { display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 } as const;

  return <div style={{ display: "grid", gap: 16 }}>
    <section style={{ border: "1px solid rgba(113,220,255,.18)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Affiliate content planner</h2>
          <p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.55 }}>Create a first-draft social post or ad concept from product facts you supply. The assistant is instructed not to invent prices, claims, availability, discounts, or personal-use endorsements.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <label style={labelStyle}>Platform
            <select value={platform} onChange={(event) => setPlatform(event.target.value)} style={fieldStyle}>
              {platforms.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label style={labelStyle}>Merchant / brand
            <input value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="Example: Focus Camera" style={fieldStyle} />
          </label>
        </div>

        <label style={labelStyle}>Product or offer
          <input value={product} onChange={(event) => setProduct(event.target.value)} placeholder="Exact product name" style={fieldStyle} />
        </label>

        <label style={labelStyle}>Affiliate link
          <input value={affiliateUrl} onChange={(event) => setAffiliateUrl(event.target.value)} placeholder="Optional tracked product or merchant link" style={fieldStyle} />
        </label>

        <label style={labelStyle}>Objective
          <input value={objective} onChange={(event) => setObjective(event.target.value)} style={fieldStyle} />
        </label>

        <label style={labelStyle}>Verified product facts / creative notes
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Paste only facts or details you want the draft to use. Example: product features, approved price, visual direction, Link in Bio requirement." style={{ ...fieldStyle, resize: "vertical" }} />
        </label>

        <button type="button" disabled={!canGenerate} onClick={generate} style={{ border: 0, borderRadius: 12, padding: "12px 16px", fontWeight: 800, cursor: canGenerate ? "pointer" : "not-allowed", background: canGenerate ? "#71dcff" : "#314653", color: "#031019" }}>
          {loading ? "Drafting…" : "Generate affiliate content"}
        </button>
        {error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}
      </div>
    </section>

    {result ? <section style={{ display: "grid", gap: 12 }}>
      {[{ label: "Primary copy", value: result.primaryCopy }, { label: "Headline", value: result.headline }, { label: "CTA", value: result.cta }].filter((item) => item.value).map((item) => <div key={item.label} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <strong>{item.label}</strong>
          <button type="button" onClick={() => void copyText(item.value || "")} style={{ border: "1px solid rgba(113,220,255,.35)", borderRadius: 10, background: "transparent", color: "#71dcff", padding: "6px 10px" }}>Copy</button>
        </div>
        <div style={{ marginTop: 9, whiteSpace: "pre-wrap", color: "#dbe9f1", lineHeight: 1.6 }}>{item.value}</div>
      </div>)}

      {result.hashtags?.length ? <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}>
        <strong>Hashtags</strong>
        <div style={{ marginTop: 8, color: "#71dcff", lineHeight: 1.6 }}>{result.hashtags.join(" ")}</div>
      </div> : null}

      {result.complianceNotes?.length ? <div style={{ border: "1px solid rgba(255,205,92,.25)", borderRadius: 14, padding: 14, background: "rgba(255,205,92,.05)" }}>
        <strong style={{ color: "#ffd76f" }}>Compliance check</strong>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20, color: "#dbe9f1", lineHeight: 1.6 }}>
          {result.complianceNotes.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div> : null}
    </section> : null}
  </div>;
}
