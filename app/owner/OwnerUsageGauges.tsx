"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";

type CostSnapshot = {
  totalUsd?: number;
  workingBudgetUsd?: number;
  calculatedRemainingUsd?: number;
  budgetUsedPercent?: number;
  leadsUsd?: number;
  adsUsd?: number;
  leadsUsedPercent?: number;
  adsUsedPercent?: number;
  featureTrackingAvailable?: boolean;
  featureTrackingNote?: string;
  error?: string;
};

function usageGaugeColor(percent: number) {
  if (percent >= 90) return "#ff5f57";
  if (percent >= 75) return "#ff9f43";
  if (percent >= 55) return "#f4d35e";
  return "#39e58c";
}

function remainingGaugeColor(percentRemaining: number) {
  if (percentRemaining <= 10) return "#ff5f57";
  if (percentRemaining <= 25) return "#ff7a45";
  if (percentRemaining <= 45) return "#f4d35e";
  return "#39e58c";
}

function UsageGauge({ label, percent, amount, detail }: { label: string; percent: number; amount: string; detail: string }) {
  const safePercent = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0));
  const color = usageGaugeColor(safePercent);
  return <div style={{ display: "grid", justifyItems: "center", gap: 6, minWidth: 0 }}>
    <div style={{ color: "#8fc9dd", fontSize: 10, fontWeight: 950, letterSpacing: ".12em", textTransform: "uppercase" }}>{label}</div>
    <div aria-label={`${label} ${safePercent.toFixed(1)} percent used`} style={{ width: 82, height: 82, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(${color} ${safePercent * 3.6}deg, rgba(255,255,255,.09) 0deg)`, boxShadow: `0 0 20px ${color}22`, position: "relative" }}>
      <div style={{ width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center", background: "#061421", border: "1px solid rgba(255,255,255,.09)" }}>
        <strong style={{ color, fontSize: 15 }}>{safePercent.toFixed(safePercent < 10 ? 1 : 0)}%</strong>
      </div>
    </div>
    <strong style={{ color: "#f3fbff", fontSize: 14 }}>{amount}</strong>
    <span style={{ color: "#7f9dac", fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>{detail}</span>
  </div>;
}

function RemainingGauge({ percentRemaining, amount, detail }: { percentRemaining: number; amount: string; detail: string }) {
  const safePercent = Math.min(100, Math.max(0, Number.isFinite(percentRemaining) ? percentRemaining : 0));
  const color = remainingGaugeColor(safePercent);
  return <div style={{ display: "grid", justifyItems: "center", gap: 6, minWidth: 0 }}>
    <div style={{ color: "#8fc9dd", fontSize: 10, fontWeight: 950, letterSpacing: ".12em", textTransform: "uppercase" }}>Overall</div>
    <div aria-label={`Overall OpenAI balance ${safePercent.toFixed(1)} percent remaining`} style={{ width: 82, height: 82, borderRadius: "50%", display: "grid", placeItems: "center", background: `conic-gradient(${color} ${safePercent * 3.6}deg, rgba(255,255,255,.09) 0deg)`, boxShadow: `0 0 20px ${color}22`, position: "relative" }}>
      <div style={{ width: 62, height: 62, borderRadius: "50%", display: "grid", placeItems: "center", background: "#061421", border: "1px solid rgba(255,255,255,.09)" }}>
        <strong style={{ color, fontSize: 15 }}>{safePercent.toFixed(safePercent < 10 ? 1 : 0)}%</strong>
      </div>
    </div>
    <strong style={{ color: "#f3fbff", fontSize: 14 }}>{amount}</strong>
    <span style={{ color: "#7f9dac", fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>{detail}</span>
  </div>;
}

export default function OwnerUsageGauges() {
  const [data, setData] = useState<CostSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    if (!key) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/openai-costs?days=30", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
      const payload = await response.json().catch(() => ({})) as CostSnapshot;
      if (!response.ok) throw new Error(payload.error || "Could not load OpenAI usage.");
      setData(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load OpenAI usage.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const budget = Number(data?.workingBudgetUsd || 5);
  const leads = Number(data?.leadsUsd || 0);
  const ads = Number(data?.adsUsd || 0);
  const total = Number(data?.totalUsd || 0);
  const remaining = Math.max(0, Number(data?.calculatedRemainingUsd ?? budget - total));
  const remainingPercent = budget > 0 ? Math.min(100, Math.max(0, (remaining / budget) * 100)) : 0;

  return <section style={{ marginBottom: 12, border: "1px solid rgba(89,203,255,.25)", borderRadius: 17, padding: "12px 10px", background: "linear-gradient(135deg,rgba(4,24,39,.96),rgba(3,14,24,.98))", boxShadow: "inset 0 0 24px rgba(52,189,255,.05)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div><div style={{ color: "#6bdcff", fontSize: 10, fontWeight: 950, letterSpacing: ".14em" }}>OPENAI USAGE</div><div style={{ marginTop: 2, color: "#91a9b7", fontSize: 10 }}>Leads and Ads fill as spending rises. Overall starts full/green and drains toward red as your balance falls.</div></div>
      <button type="button" onClick={() => void load()} disabled={loading} style={{ border: "1px solid rgba(113,220,255,.3)", borderRadius: 9, background: "rgba(113,220,255,.07)", color: "#71dcff", padding: "6px 8px", fontSize: 10, fontWeight: 900 }}>{loading ? "…" : "Refresh"}</button>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
      <UsageGauge label="Leads" percent={Number(data?.leadsUsedPercent || 0)} amount={`$${leads.toFixed(3)} used`} detail={`of $${budget.toFixed(2)} working budget`} />
      <UsageGauge label="Ads" percent={Number(data?.adsUsedPercent || 0)} amount={`$${ads.toFixed(3)} used`} detail="copy + photo generation" />
      <RemainingGauge percentRemaining={remainingPercent} amount={`$${remaining.toFixed(2)} left`} detail={`$${total.toFixed(3)} OpenAI spend`} />
    </div>
    {error ? <div style={{ marginTop: 9, color: "#ff9b9b", fontSize: 10 }}>{error}</div> : null}
    {!error && data && !data.featureTrackingAvailable ? <div style={{ marginTop: 9, color: "#f3c96b", fontSize: 10 }}>Lead/Ads feature tracking is not available yet; Overall still comes from OpenAI organization costs.</div> : null}
  </section>;
}
