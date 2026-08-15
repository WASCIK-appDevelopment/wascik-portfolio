"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "new" | "contacted" | "in_progress" | "closed";
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  business?: string | null;
  project_type?: string | null;
  goals?: string[] | null;
  features?: string[] | null;
  budget?: string | null;
  timeline?: string | null;
  source_path?: string | null;
  summary?: string | null;
  conversation?: Array<{ role?: string; content?: string }> | null;
  qualification_score?: number | null;
  qualification_status?: string | null;
};

const labels: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  closed: "Closed",
};

export default function LeadConsoleClient() {
  const [key, setKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | Lead["status"]>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("wascik-owner-console-key") || "";
    if (saved) {
      setKey(saved);
      void loadLeads(saved);
    }
  }, []);

  async function loadLeads(ownerKey = key) {
    if (!ownerKey) return;
    setLoading(true);
    setError("");
    const response = await fetch("/api/owner/leads", { headers: { "x-wascik-owner-key": ownerKey }, cache: "no-store" });
    if (!response.ok) {
      setLoading(false);
      setError(response.status === 401 ? "That owner passcode was not accepted." : "Could not load leads right now.");
      if (response.status === 401) sessionStorage.removeItem("wascik-owner-console-key");
      return;
    }
    const data = await response.json();
    setLeads(Array.isArray(data.leads) ? data.leads : []);
    setLoading(false);
  }

  function unlock(event: FormEvent) {
    event.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    sessionStorage.setItem("wascik-owner-console-key", trimmed);
    setKey(trimmed);
    void loadLeads(trimmed);
  }

  async function updateStatus(id: string, status: Lead["status"]) {
    const response = await fetch("/api/owner/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) {
      setError("Could not update that lead status.");
      return;
    }
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));
  }

  const counts = useMemo(() => ({
    all: leads.length,
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    in_progress: leads.filter((lead) => lead.status === "in_progress").length,
    closed: leads.filter((lead) => lead.status === "closed").length,
  }), [leads]);

  const visible = filter === "all" ? leads : leads.filter((lead) => lead.status === filter);

  if (!key) {
    return <main className="owner-shell"><section className="owner-unlock"><div className="owner-kicker">WASCIK PRIVATE CONSOLE</div><h1>Owner Lead Inbox</h1><p>Enter your owner passcode. This passcode stays in this Safari session and is never stored in the public page source.</p><form onSubmit={unlock}><input type="password" value={inputKey} onChange={(event) => setInputKey(event.target.value)} placeholder="Owner passcode" autoComplete="current-password"/><button type="submit">Unlock console</button></form>{error && <p className="owner-error">{error}</p>}</section></main>;
  }

  return <main className="owner-shell">
    <header className="owner-header"><div><div className="owner-kicker">WASCIK PRIVATE CONSOLE</div><h1>Lead Inbox</h1><p>Captured by the AI representative and stored in Supabase.</p></div><button className="owner-refresh" onClick={() => void loadLeads()}>{loading ? "Refreshing…" : "Refresh"}</button></header>
    <section className="owner-stats">
      {(["all", "new", "contacted", "in_progress", "closed"] as const).map((status) => <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}><strong>{counts[status]}</strong><span>{status === "all" ? "All" : labels[status]}</span></button>)}
    </section>
    {error && <p className="owner-error">{error}</p>}
    <section className="lead-list">
      {!loading && visible.length === 0 && <div className="owner-empty">No leads in this view yet.</div>}
      {visible.map((lead) => {
        const open = expanded === lead.id;
        const contact = lead.email || lead.phone || "No contact shown";
        return <article className="lead-card" key={lead.id}>
          <div className="lead-top"><div><span className={`lead-status status-${lead.status}`}>{labels[lead.status]}</span><h2>{lead.business || lead.name || "New WASCIK lead"}</h2><p>{lead.project_type || "Project inquiry"} · {contact}</p></div><time>{new Date(lead.created_at).toLocaleString()}</time></div>
          <div className="lead-grid">
            <div><span>Budget</span><strong>{lead.budget || "Not provided"}</strong></div>
            <div><span>Timeline</span><strong>{lead.timeline || "Not provided"}</strong></div>
            <div><span>Source</span><strong>{lead.source_path || "/"}</strong></div>
            <div><span>Score</span><strong>{typeof lead.qualification_score === "number" ? `${lead.qualification_score}/100` : "—"}</strong></div>
          </div>
          {lead.features && lead.features.length > 0 && <div className="lead-tags">{lead.features.map((feature) => <span key={feature}>{feature}</span>)}</div>}
          <p className="lead-summary">{lead.summary || "No summary available yet."}</p>
          <div className="lead-actions">
            <select value={lead.status} onChange={(event) => void updateStatus(lead.id, event.target.value as Lead["status"])}><option value="new">New</option><option value="contacted">Contacted</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select>
            <button onClick={() => setExpanded(open ? null : lead.id)}>{open ? "Hide details" : "View details"}</button>
          </div>
          {open && <div className="lead-details"><h3>Contact & project</h3><p><b>Name:</b> {lead.name || "Not provided"}<br/><b>Email:</b> {lead.email || "Not provided"}<br/><b>Phone:</b> {lead.phone || "Not provided"}<br/><b>Business:</b> {lead.business || "Not provided"}<br/><b>Project:</b> {lead.project_type || "Not provided"}</p><h3>Conversation</h3><div className="conversation">{(lead.conversation || []).map((turn, index) => <div className={`turn ${turn.role === "assistant" ? "assistant" : "visitor"}`} key={`${lead.id}-${index}`}><strong>{turn.role === "assistant" ? "WASCIK AI" : "Visitor"}</strong><p>{turn.content}</p></div>)}</div></div>}
        </article>;
      })}
    </section>
  </main>;
}
