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
  owner_notes?: string | null;
  next_action?: string | null;
  follow_up_at?: string | null;
};

type Draft = { owner_notes: string; next_action: string; follow_up_at: string };
type AssistantTurn = { role: "owner" | "assistant"; content: string };

const labels: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  closed: "Closed",
};

function localInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function LeadConsoleClient() {
  const [key, setKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | Lead["status"]>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTurns, setAiTurns] = useState<AssistantTurn[]>([
    { role: "assistant", content: "I can analyze your live WASCIK leads. Ask me which leads are new, who needs follow-up, what a customer wants, or which leads mention a specific service." },
  ]);

  useEffect(() => {
    const saved = sessionStorage.getItem("wascik-owner-console-key") || "";
    if (saved) {
      setKey(saved);
      void loadLeads(saved);
    }
  }, []);

  function syncDrafts(nextLeads: Lead[]) {
    setDrafts((current) => {
      const next = { ...current };
      for (const lead of nextLeads) {
        if (!next[lead.id]) next[lead.id] = {
          owner_notes: lead.owner_notes || "",
          next_action: lead.next_action || "",
          follow_up_at: localInputValue(lead.follow_up_at),
        };
      }
      return next;
    });
  }

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
    const nextLeads = Array.isArray(data.leads) ? data.leads : [];
    setLeads(nextLeads);
    syncDrafts(nextLeads);
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

  async function updateLead(id: string, patch: Record<string, unknown>, failureMessage: string) {
    const response = await fetch("/api/owner/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!response.ok) {
      setError(failureMessage);
      return null;
    }
    const data = await response.json();
    if (data.lead) setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, ...data.lead } : lead));
    return data.lead as Lead | null;
  }

  async function updateStatus(id: string, status: Lead["status"]) {
    setError("");
    setNotice("");
    const updated = await updateLead(id, { status }, "Could not update that lead status.");
    if (updated) setNotice(`Lead moved to ${labels[status]}.`);
  }

  async function saveOwnerDetails(lead: Lead) {
    const draft = drafts[lead.id] || { owner_notes: "", next_action: "", follow_up_at: "" };
    setSaving(lead.id);
    setError("");
    setNotice("");
    const updated = await updateLead(lead.id, {
      owner_notes: draft.owner_notes,
      next_action: draft.next_action,
      follow_up_at: draft.follow_up_at ? new Date(draft.follow_up_at).toISOString() : "",
    }, "Could not save the owner notes or follow-up.");
    setSaving(null);
    if (updated) {
      setNotice("Lead notes and follow-up saved.");
      setDrafts((current) => ({ ...current, [lead.id]: {
        owner_notes: updated.owner_notes || "",
        next_action: updated.next_action || "",
        follow_up_at: localInputValue(updated.follow_up_at),
      }}));
    }
  }

  async function askOwnerAI(event: FormEvent) {
    event.preventDefault();
    const question = aiQuestion.trim();
    if (!question || aiLoading) return;
    setAiQuestion("");
    setAiLoading(true);
    setAiTurns((current) => [...current, { role: "owner", content: question }]);
    const response = await fetch("/api/owner/leads/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
      body: JSON.stringify({ question }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAiTurns((current) => [...current, { role: "assistant", content: data.error || "I could not analyze the leads right now." }]);
      setAiLoading(false);
      return;
    }
    setAiTurns((current) => [...current, { role: "assistant", content: data.text || "No answer returned." }]);
    setAiLoading(false);
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

    <nav className="owner-console-nav" aria-label="Owner console modules">
      <a className="active" href="/owner/leads">Leads</a>
      <span>Social & Ads</span><span>Affiliate Search</span><span>Click Analytics</span><span>Product Status</span>
    </nav>

    <section className="owner-ai-panel">
      <div className="owner-ai-heading"><div><div className="owner-kicker">OWNER AI</div><h2>Lead Assistant</h2><p>Read-only for now. It analyzes the live lead database but cannot change records yet.</p></div><span className="owner-ai-live">LIVE DATA · {leads.length} LEADS</span></div>
      <div className="owner-ai-messages">
        {aiTurns.map((turn, index) => <div className={`owner-ai-turn ${turn.role}`} key={`${turn.role}-${index}`}><strong>{turn.role === "owner" ? "You" : "WASCIK Owner AI"}</strong><p>{turn.content}</p></div>)}
        {aiLoading && <div className="owner-ai-turn assistant"><strong>WASCIK Owner AI</strong><p>Analyzing your leads…</p></div>}
      </div>
      <form className="owner-ai-form" onSubmit={askOwnerAI}><input value={aiQuestion} onChange={(event) => setAiQuestion(event.target.value)} placeholder="Ask: Which new leads need my attention?"/><button type="submit" disabled={aiLoading}>{aiLoading ? "Thinking…" : "Ask Owner AI"}</button></form>
      <div className="owner-ai-prompts"><button onClick={() => setAiQuestion("Which leads need my attention first and why?")}>Priority leads</button><button onClick={() => setAiQuestion("Which leads are still new and have not been contacted?")}>Uncontacted</button><button onClick={() => setAiQuestion("Summarize my current lead pipeline by status and project type.")}>Pipeline summary</button></div>
    </section>

    <section className="owner-stats">
      {(["all", "new", "contacted", "in_progress", "closed"] as const).map((status) => <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}><strong>{counts[status]}</strong><span>{status === "all" ? "All" : labels[status]}</span></button>)}
    </section>
    {error && <p className="owner-error">{error}</p>}
    {notice && <p className="owner-notice">{notice}</p>}
    <section className="lead-list">
      {!loading && visible.length === 0 && <div className="owner-empty">No leads in this view yet.</div>}
      {visible.map((lead) => {
        const open = expanded === lead.id;
        const contact = lead.email || lead.phone || "No contact shown";
        const draft = drafts[lead.id] || { owner_notes: lead.owner_notes || "", next_action: lead.next_action || "", follow_up_at: localInputValue(lead.follow_up_at) };
        return <article className="lead-card" key={lead.id}>
          <div className="lead-top"><div><span className={`lead-status status-${lead.status}`}>{labels[lead.status]}</span><h2>{lead.business || lead.name || "New WASCIK lead"}</h2><p>{lead.project_type || "Project inquiry"} · {contact}</p></div><time>{new Date(lead.created_at).toLocaleString()}</time></div>
          <div className="lead-grid">
            <div><span>Budget</span><strong>{lead.budget || "Not provided"}</strong></div>
            <div><span>Timeline</span><strong>{lead.timeline || "Not provided"}</strong></div>
            <div><span>Source</span><strong>{lead.source_path || "/"}</strong></div>
            <div><span>Score</span><strong>{typeof lead.qualification_score === "number" ? `${lead.qualification_score}/100` : "—"}</strong></div>
          </div>
          {lead.features && lead.features.length > 0 && <div className="lead-tags">{lead.features.map((feature) => <span key={feature}>{feature}</span>)}</div>}
          {lead.next_action && <p className="lead-next"><b>Next action:</b> {lead.next_action}{lead.follow_up_at ? ` · ${new Date(lead.follow_up_at).toLocaleString()}` : ""}</p>}
          <p className="lead-summary">{lead.summary || "No summary available yet."}</p>
          <div className="lead-actions">
            <select value={lead.status} onChange={(event) => void updateStatus(lead.id, event.target.value as Lead["status"])}><option value="new">New</option><option value="contacted">Contacted</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select>
            <button onClick={() => setExpanded(open ? null : lead.id)}>{open ? "Hide details" : "View details"}</button>
          </div>
          {open && <div className="lead-details">
            <h3>Contact & project</h3><p><b>Name:</b> {lead.name || "Not provided"}<br/><b>Email:</b> {lead.email || "Not provided"}<br/><b>Phone:</b> {lead.phone || "Not provided"}<br/><b>Business:</b> {lead.business || "Not provided"}<br/><b>Project:</b> {lead.project_type || "Not provided"}</p>
            <h3>Owner follow-up</h3>
            <div className="owner-crm-fields">
              <label><span>Next action</span><input value={draft.next_action} onChange={(event) => setDrafts((current) => ({ ...current, [lead.id]: { ...draft, next_action: event.target.value } }))} placeholder="Example: Call Monday and discuss scope" /></label>
              <label><span>Follow-up date & time</span><input type="datetime-local" value={draft.follow_up_at} onChange={(event) => setDrafts((current) => ({ ...current, [lead.id]: { ...draft, follow_up_at: event.target.value } }))} /></label>
              <label className="owner-notes-field"><span>Owner notes</span><textarea value={draft.owner_notes} onChange={(event) => setDrafts((current) => ({ ...current, [lead.id]: { ...draft, owner_notes: event.target.value } }))} placeholder="Private notes about this lead, call outcome, financing discussion, scope ideas, or anything you want the owner AI to remember later." /></label>
              <button className="save-owner-details" disabled={saving === lead.id} onClick={() => void saveOwnerDetails(lead)}>{saving === lead.id ? "Saving…" : "Save notes & follow-up"}</button>
            </div>
            <h3>Conversation</h3><div className="conversation">{(lead.conversation || []).map((turn, index) => <div className={`turn ${turn.role === "assistant" ? "assistant" : "visitor"}`} key={`${lead.id}-${index}`}><strong>{turn.role === "assistant" ? "WASCIK AI" : "Visitor"}</strong><p>{turn.content}</p></div>)}</div>
          </div>}
        </article>;
      })}
    </section>
  </main>;
}
