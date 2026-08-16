"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";
const AFFILIATE_SEARCH_SESSION_KEY = "wascik-affiliate-search-session-v1";

const modules = [
  ["Home", "/owner"],
  ["Leads", "/owner/leads"],
  ["Social & Ads", "/owner/social-ads"],
  ["Affiliate Search", "/owner/affiliate-search"],
  ["Click Analytics", "/owner/click-analytics"],
  ["Product Status", "/owner/product-status"],
] as const;

type Props = {
  title: string;
  kicker?: string;
  description: string;
  currentPath: string;
  children: ReactNode;
};

export default function OwnerModuleClient({ title, kicker = "WASCIK PRIVATE CONSOLE", description, currentPath, children }: Props) {
  const [key, setKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  async function verify(ownerKey: string) {
    setChecking(true);
    setError("");
    const response = await fetch("/api/owner/session", { headers: { "x-wascik-owner-key": ownerKey }, cache: "no-store" });
    if (!response.ok) {
      sessionStorage.removeItem(SESSION_KEY);
      setKey("");
      setError("That owner passcode was not accepted.");
      setChecking(false);
      return;
    }
    setKey(ownerKey);
    setChecking(false);
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY) || "";
    const timer = window.setTimeout(() => {
      if (saved) void verify(saved);
      else setChecking(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function unlock(event: FormEvent) {
    event.preventDefault();
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    sessionStorage.setItem(SESSION_KEY, trimmed);
    void verify(trimmed);
  }

  function signOut() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(AFFILIATE_SEARCH_SESSION_KEY);
    setKey("");
    setInputKey("");
    setError("");
  }

  const shell: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#061423,#020913)", color: "#eaf6ff", padding: "22px 14px 60px", fontFamily: "inherit" };
  const panel: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", border: "1px solid rgba(80,196,255,.3)", borderRadius: 24, background: "rgba(5,20,33,.86)", boxShadow: "0 24px 70px rgba(0,0,0,.32)", padding: 20 };

  if (checking) return <main style={shell}><section style={{ ...panel, maxWidth: 560 }}><strong>Opening WASCIK Owner Console…</strong></section></main>;

  if (!key) {
    return <main style={shell}><section style={{ ...panel, maxWidth: 560 }}>
      <div style={{ color: "#6bdcff", fontSize: 12, fontWeight: 900, letterSpacing: ".16em" }}>{kicker}</div>
      <h1 style={{ margin: "10px 0 8px", fontSize: 32 }}>Owner Console</h1>
      <p style={{ color: "#a9bdcc", lineHeight: 1.6 }}>Enter your owner passcode to open the private business console.</p>
      <form onSubmit={unlock} style={{ display: "grid", gap: 10, marginTop: 18 }}>
        <input type="password" value={inputKey} onChange={(event) => setInputKey(event.target.value)} placeholder="Owner passcode" style={{ minHeight: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,.15)", background: "#07111c", color: "white", padding: "0 14px", fontSize: 16 }} />
        <button type="submit" style={{ minHeight: 48, border: 0, borderRadius: 14, background: "linear-gradient(135deg,#1d74ff,#0eb9ce)", color: "white", fontWeight: 900 }}>Unlock console</button>
      </form>
      {error && <p style={{ color: "#ff9b9b", marginTop: 12 }}>{error}</p>}
    </section></main>;
  }

  return <main style={shell}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <header style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div><div style={{ color: "#6bdcff", fontSize: 12, fontWeight: 900, letterSpacing: ".16em" }}>{kicker}</div>
        <h1 style={{ margin: "8px 0 4px", fontSize: "clamp(30px,7vw,48px)" }}>{title}</h1>
        <p style={{ color: "#a9bdcc", lineHeight: 1.6, maxWidth: 760, margin: 0 }}>{description}</p></div>
        <button type="button" onClick={signOut} style={{ flex: "0 0 auto", minHeight: 42, padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.06)", color: "#d5e8f2", fontWeight: 850 }}>Sign out</button>
      </header>

      <nav style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 12 }} aria-label="Owner console modules">
        {modules.map(([label, href]) => <a key={href} href={href} style={{ whiteSpace: "nowrap", textDecoration: "none", color: currentPath === href ? "#03111b" : "#bfeaff", background: currentPath === href ? "#72dcff" : "rgba(45,160,220,.12)", border: "1px solid rgba(89,203,255,.35)", borderRadius: 999, padding: "9px 13px", fontWeight: 850, fontSize: 13 }}>{label}</a>)}
      </nav>

      <section style={panel}>{children}</section>
    </div>
  </main>;
}
