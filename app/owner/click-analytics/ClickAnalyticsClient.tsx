"use client";

import { useEffect, useState } from "react";

type Ranked = { label: string; count: number };
type Recent = { id: string; created_at: string; merchant?: string | null; item_label?: string | null; source_path?: string | null; destination_host?: string | null };
type Analytics = {
  totalClicks: number;
  last24h: number;
  last7d: number;
  uniqueSessions: number;
  topMerchants: Ranked[];
  topSources: Ranked[];
  topItems: Ranked[];
  recent: Recent[];
};

export default function ClickAnalyticsClient() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const key = sessionStorage.getItem("wascik-owner-console-key") || "";
    if (!key) {
      setError("Open the Owner Console home first and unlock it with your passcode.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const response = await fetch("/api/owner/click-analytics", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || "Could not load click analytics.");
      setLoading(false);
      return;
    }
    setData(json);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  if (loading) return <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,.04)" }}>Loading click analytics…</div>;
  if (error) return <div style={{ padding: 18, borderRadius: 16, border: "1px solid rgba(255,100,100,.25)", color: "#ffb3b3" }}>{error}</div>;
  if (!data) return null;

  const stat = (label: string, value: number) => <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.03)" }}><strong style={{ display: "block", fontSize: 28 }}>{value}</strong><span style={{ color: "#9fb5c5", fontSize: 12 }}>{label}</span></div>;
  const ranked = (title: string, rows: Ranked[]) => <section style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}><h3 style={{ marginTop: 0 }}>{title}</h3>{rows.length ? rows.map((row, index) => <div key={`${title}-${row.label}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderTop: index ? "1px solid rgba(255,255,255,.06)" : undefined }}><span style={{ color: "#bdd0dd", overflowWrap: "anywhere" }}>{row.label}</span><strong>{row.count}</strong></div>) : <p style={{ color: "#8198a8" }}>No tracked clicks yet.</p>}</section>;

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><div><h2 style={{ margin: 0 }}>Live first-party click analytics</h2><p style={{ margin: "5px 0 0", color: "#9fb5c5" }}>WASCIK-tracked outbound affiliate activity stored in Supabase.</p></div><button onClick={() => void load()} style={{ border: "1px solid rgba(120,217,255,.35)", borderRadius: 12, padding: "9px 13px", background: "rgba(36,132,255,.12)", color: "#c9f2ff", fontWeight: 800 }}>Refresh</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10 }}>{stat("Total clicks", data.totalClicks)}{stat("Last 24 hours", data.last24h)}{stat("Last 7 days", data.last7d)}{stat("Unique sessions", data.uniqueSessions)}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>{ranked("Top merchants", data.topMerchants)}{ranked("Top products / offers", data.topItems)}{ranked("Top source pages", data.topSources)}</div>
    <section style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}><h3 style={{ marginTop: 0 }}>Recent activity</h3>{data.recent.length ? data.recent.map((event) => <div key={event.id} style={{ padding: "10px 0", borderTop: "1px solid rgba(255,255,255,.06)" }}><strong>{event.merchant || event.destination_host || "Affiliate click"}</strong>{event.item_label ? <span> · {event.item_label}</span> : null}<div style={{ color: "#8fa7b7", fontSize: 12, marginTop: 3 }}>{event.source_path || "/"} · {new Date(event.created_at).toLocaleString()}</div></div>) : <p style={{ color: "#8198a8" }}>No tracked clicks yet. Once an instrumented affiliate link is tapped, it will appear here.</p>}</section>
  </div>;
}
