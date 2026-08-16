"use client";

import { FormEvent, useEffect, useState } from "react";
import { AFFILIATE_BATCH_SIZE, affiliateSearchCategories, AffiliateSearchCategoryId } from "../../../lib/affiliateSearch";

const SESSION_KEY = "wascik-owner-console-key";

type ProductCandidate = {
  id: string;
  merchant: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  affiliateUrl: string;
  pagePath?: string | null;
  source: string;
};

type Batch = { categoryId: string; categoryLabel: string; requestedCount: number; items: ProductCandidate[] };

export default function AffiliateSearchClient() {
  const [selected, setSelected] = useState<AffiliateSearchCategoryId[]>([]);
  const [providers, setProviders] = useState({ impact: false, awin: false });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    if (!key) return;
    void fetch("/api/owner/affiliate-search", { headers: { "x-wascik-owner-key": key }, cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("status")))
      .then((data) => setProviders(data.providers || { impact: false, awin: false }))
      .catch(() => setError("Could not check affiliate network connections."));
  }, []);

  function toggle(categoryId: AffiliateSearchCategoryId) {
    setSelected((current) => current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]);
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!selected.length || loading) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/owner/affiliate-search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ categories: selected, batchSize: AFFILIATE_BATCH_SIZE }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Affiliate search failed.");
      setBatches(Array.isArray(data.batches) ? data.batches : []);
      setProviders(data.providers || providers);
      setNotice(data.notice || "Review batch prepared.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Affiliate search failed.");
    } finally {
      setLoading(false);
    }
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <section style={{ padding: 16, border: "1px solid rgba(105,214,255,.28)", borderRadius: 18, background: "linear-gradient(135deg,rgba(34,132,255,.13),rgba(0,205,218,.06))" }}>
      <div style={{ color: "#72e0ff", fontWeight: 900, fontSize: 11, letterSpacing: ".12em" }}>AFFILIATE SEARCH WORKFLOW</div>
      <h2 style={{ margin: "8px 0 7px" }}>Choose categories → fetch 20 each → review before approval</h2>
      <p style={{ margin: 0, color: "#aec4d2", lineHeight: 1.6 }}>You select the categories. Owner AI will search only connected, approved affiliate-network data and prepare up to {AFFILIATE_BATCH_SIZE} real product candidates for every selected category. Nothing is published automatically—you decide what belongs on WASCIK affiliate pages.</p>
    </section>

    <section style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
      <div style={{ padding: 13, border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }}><strong>Impact</strong><div style={{ color: providers.impact ? "#8ff0b6" : "#ffcf76", marginTop: 5, fontSize: 12 }}>{providers.impact ? "CONNECTED" : "CONNECTION REQUIRED"}</div></div>
      <div style={{ padding: 13, border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }}><strong>Awin</strong><div style={{ color: providers.awin ? "#8ff0b6" : "#ffcf76", marginTop: 5, fontSize: 12 }}>{providers.awin ? "CONNECTED" : "CONNECTION REQUIRED"}</div></div>
    </section>

    <form onSubmit={search} style={{ display: "grid", gap: 13 }}>
      <div><h2 style={{ margin: "0 0 5px" }}>Select product categories</h2><p style={{ margin: 0, color: "#9fb6c5" }}>Each selected category requests a separate batch of {AFFILIATE_BATCH_SIZE} products.</p></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 9 }}>
        {affiliateSearchCategories.map((category) => {
          const active = selected.includes(category.id);
          return <button type="button" key={category.id} onClick={() => toggle(category.id)} aria-pressed={active} style={{ minHeight: 52, padding: "10px 12px", textAlign: "left", borderRadius: 13, border: active ? "1px solid #66ddff" : "1px solid rgba(255,255,255,.12)", background: active ? "rgba(31,148,211,.22)" : "rgba(255,255,255,.03)", color: "white", fontWeight: 800, cursor: "pointer" }}>{active ? "✓ " : ""}{category.label}</button>;
        })}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><button type="submit" disabled={!selected.length || loading} style={{ minHeight: 48, padding: "11px 18px", border: 0, borderRadius: 13, background: "linear-gradient(135deg,#2678ff,#09b9cf)", color: "white", fontWeight: 900, cursor: "pointer", opacity: !selected.length || loading ? .55 : 1 }}>{loading ? "Preparing batches…" : `Find ${AFFILIATE_BATCH_SIZE} per category`}</button><span style={{ color: "#8faaba", fontSize: 13 }}>{selected.length} selected · up to {selected.length * AFFILIATE_BATCH_SIZE} candidates</span></div>
    </form>

    {error && <p style={{ margin: 0, padding: 12, borderRadius: 12, background: "#3a1219", color: "#ffd7dc" }}>{error}</p>}
    {notice && <p style={{ margin: 0, padding: 12, borderRadius: 12, background: "#102d22", color: "#bdf4cd" }}>{notice}</p>}

    {batches.map((batch) => <section key={batch.categoryId} style={{ display: "grid", gap: 10 }}>
      <div><h2 style={{ margin: 0 }}>{batch.categoryLabel}</h2><p style={{ margin: "4px 0 0", color: "#91aebe" }}>{batch.items.length} of {batch.requestedCount} currently available for review</p></div>
      {batch.items.length === 0 ? <div style={{ padding: 15, borderRadius: 14, border: "1px dashed rgba(255,255,255,.2)", color: "#a7bdca" }}>No approved local items match yet. A live Impact or Awin feed connection is required to fill this 20-product batch.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
        {batch.items.map((item) => <article key={item.id} style={{ padding: 14, borderRadius: 15, border: "1px solid rgba(255,255,255,.11)", background: "rgba(255,255,255,.035)" }}><div style={{ color: "#70dcff", fontSize: 11, fontWeight: 900 }}>{item.merchant}</div><h3 style={{ margin: "6px 0", fontSize: 17 }}>{item.title}</h3><p style={{ color: "#aabfcb", lineHeight: 1.5, fontSize: 13 }}>{item.description}</p><small style={{ color: "#7899aa" }}>{item.source}</small></article>)}
      </div>}
    </section>)}
  </div>;
}
