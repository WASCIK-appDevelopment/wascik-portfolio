"use client";

import { FormEvent, useState } from "react";

export default function Stage3LiveDemo() {
  const [businessType, setBusinessType] = useState("service");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/ai-funnel/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, businessType }),
    });
    const data = await response.json().catch(() => ({}));
    setReply(response.ok ? data.text : data.error ?? "The representative could not respond.");
    setLoading(false);
  }

  return (
    <section style={{ width: "min(1180px, calc(100% - 30px))", margin: "0 auto 100px", padding: 28, borderRadius: 28, border: "1px solid rgba(112,185,255,.18)", background: "#081321", color: "white" }}>
      <p style={{ color: "#7fd7ff", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>STAGE 3 BACKEND DEMO</p>
      <h2 style={{ fontSize: "clamp(2rem,5vw,4rem)", margin: "10px 0 14px" }}>Ask the representative a question.</h2>
      <p style={{ color: "#aebed0", lineHeight: 1.6 }}>This now sends a real browser request to the new WASCIK representative server endpoint. The current response engine is controlled while the external AI provider connection is prepared.</p>
      <form onSubmit={send} style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} style={{ padding: 13, borderRadius: 13, background: "#050d18", color: "white" }}>
          <option value="service">Service business</option><option value="retail">Retail / affiliate</option><option value="church">Church / organization</option><option value="custom">Custom business</option>
        </select>
        <input required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Example: How could you help customers on my website?" style={{ padding: 14, borderRadius: 13, border: "1px solid rgba(255,255,255,.12)", background: "#050d18", color: "white" }} />
        <button disabled={loading} style={{ padding: 14, border: 0, borderRadius: 999, background: "#236de8", color: "white", fontWeight: 900 }}>{loading ? "Thinking..." : "Ask Representative"}</button>
      </form>
      {reply ? <div style={{ marginTop: 18, padding: 18, borderRadius: 18, background: "rgba(255,255,255,.05)", color: "#d8e6f3", lineHeight: 1.65 }}>{reply}</div> : null}
    </section>
  );
}
