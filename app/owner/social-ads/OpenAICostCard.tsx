"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";

type CostRow = { lineItem?: string; projectId?: string; apiKeyId?: string; costUsd?: number };
type CostPayload = {
  totalUsd?: number;
  workingBudgetUsd?: number;
  calculatedRemainingUsd?: number;
  lookbackDays?: number;
  budgetNote?: string;
  byLineItem?: CostRow[];
  error?: string;
};

export default function OpenAICostCard() {
  const [data, setData] = useState<CostPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/openai-costs?days=30", {
        headers: { "x-wascik-owner-key": key },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({})) as CostPayload;
      if (!response.ok) throw new Error(payload.error || "Could not load OpenAI costs.");
      setData(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load OpenAI costs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return <section style={{ border: "1px solid rgba(255,215,111,.25)", borderRadius: 16, padding: 16, background: "rgba(255,215,111,.045)", display: "grid", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ color: "#ffd76f", fontSize: 12, fontWeight: 900 }}>OPENAI ACCOUNT COST MONITOR</div>
        <h2 style={{ margin: "5px 0 0" }}>Organization API spend</h2>
      </div>
      <button type="button" onClick={() => void load()} disabled={loading} style={{ border: "1px solid rgba(255,215,111,.35)", borderRadius: 10, background: "transparent", color: "#ffd76f", padding: "7px 10px", cursor: loading ? "not-allowed" : "pointer", fontWeight: 800 }}>{loading ? "Refreshing…" : "Refresh"}</button>
    </div>

    {loading && !data ? <div style={{ color: "#aebeca" }}>Loading real OpenAI organization costs…</div> : null}
    {error ? <div style={{ color: "#ffaaaa" }}>{error}</div> : null}

    {data ? <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <div style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,.025)" }}><div style={{ color: "#91a8b7", fontSize: 12 }}>Actual org spend · {data.lookbackDays || 30} days</div><strong style={{ display: "block", marginTop: 5, fontSize: 22 }}>${Number(data.totalUsd || 0).toFixed(4)}</strong></div>
        <div style={{ border: "1px solid rgba(255,255,255,.09)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,.025)" }}><div style={{ color: "#91a8b7", fontSize: 12 }}>Working budget</div><strong style={{ display: "block", marginTop: 5, fontSize: 22 }}>${Number(data.workingBudgetUsd || 0).toFixed(2)}</strong></div>
        <div style={{ border: "1px solid rgba(143,240,184,.18)", borderRadius: 12, padding: 12, background: "rgba(143,240,184,.04)" }}><div style={{ color: "#91a8b7", fontSize: 12 }}>Calculated remaining</div><strong style={{ display: "block", marginTop: 5, fontSize: 22, color: "#8ff0b8" }}>${Number(data.calculatedRemainingUsd || 0).toFixed(4)}</strong></div>
      </div>

      {data.byLineItem?.length ? <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 10 }}><strong style={{ fontSize: 13 }}>Cost categories reported by OpenAI</strong><div style={{ display: "grid", gap: 5, marginTop: 7 }}>{data.byLineItem.slice(0, 8).map((row, index) => <div key={`${row.lineItem}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#cbd9e2", fontSize: 12 }}><span>{row.lineItem || "Unclassified"}</span><span>${Number(row.costUsd || 0).toFixed(4)}</span></div>)}</div></div> : null}

      <div style={{ color: "#91a8b7", fontSize: 11, lineHeight: 1.5 }}>{data.budgetNote}</div>
    </> : null}
  </section>;
}
