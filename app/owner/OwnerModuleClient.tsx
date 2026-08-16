"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";
const AFFILIATE_SEARCH_SESSION_KEY = "wascik-affiliate-search-session-v1";

const modules = [
  ["Home", "/owner"],
  ["Leads", "/owner/leads"],
  ["Social & Ads", "/owner/social-ads"],
  ["Brand Discovery", "/owner/brand-discovery"],
  ["Affiliate Search", "/owner/affiliate-search"],
  ["Published Products", "/owner/published-products"],
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
  const [menuOpen, setMenuOpen] = useState(false);

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

      <nav style={{ marginBottom: 14 }} aria-label="Owner console modules">
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="wascik-console-menu" style={{ width: "100%", display: "grid", gridTemplateColumns: "52px minmax(0,1fr) auto", gap: 11, alignItems: "center", minHeight: 64, padding: "8px 12px", borderRadius: 17, border: "1px solid rgba(91,216,255,.55)", background: "linear-gradient(135deg,rgba(15,73,111,.94),rgba(4,26,43,.96))", color: "white", boxShadow: "inset 0 0 24px rgba(52,189,255,.09),0 10px 28px rgba(0,0,0,.24)", textAlign: "left" }}>
          <span aria-hidden="true" style={{ width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: 15, border: "1px solid #65ddff", background: "radial-gradient(circle at 50% 35%,#0d314b,#02060d 72%)", boxShadow: "inset 0 0 12px rgba(48,203,255,.2),0 0 12px rgba(48,203,255,.18)" }}><svg width="35" height="35" viewBox="0 0 48 48" role="img" aria-label="WASCIK W"><defs><linearGradient id="wascikMenuW" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d9f5ff" /><stop offset=".38" stopColor="#13d9ff" /><stop offset=".72" stopColor="#1267ff" /><stop offset="1" stopColor="#0734a8" /></linearGradient></defs><path d="M3 7h8l6.5 22L24 15l6.5 14L37 7h8L35 42 24 27 13 42 3 7Z" fill="url(#wascikMenuW)" /><path d="M7 10h4.5l6 20.5" fill="none" stroke="#77ecff" strokeWidth="1.2" opacity=".85" /><circle cx="6" cy="31" r="1.5" fill="#18dbff" /><circle cx="10" cy="36" r="1" fill="#147cff" /></svg></span>
          <span style={{ minWidth: 0 }}><span style={{ display: "block", color: "#74ddff", fontSize: 11, fontWeight: 950, letterSpacing: ".14em" }}>WASCIK CONTROL MENU</span><span style={{ display: "block", marginTop: 4, fontSize: 15, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{modules.find(([, href]) => href === currentPath)?.[0] || "Owner Console"}</span></span>
          <span aria-hidden="true" style={{ display: "grid", gap: 4, justifyItems: "end" }}><span style={{ color: "#a9edff", fontSize: 20, lineHeight: 1, transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .18s ease" }}>⌄</span><span style={{ color: "#7fb6ca", fontSize: 9, fontWeight: 900, letterSpacing: ".08em" }}>{menuOpen ? "CLOSE" : "OPEN"}</span></span>
        </button>
        {menuOpen && <div id="wascik-console-menu" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 8, marginTop: 8, padding: 10, borderRadius: 15, border: "1px solid rgba(89,203,255,.28)", background: "rgba(3,17,29,.96)", boxShadow: "0 16px 34px rgba(0,0,0,.28)" }}>
          {modules.map(([label, href]) => <a key={href} href={href} aria-current={currentPath === href ? "page" : undefined} style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, textDecoration: "none", color: currentPath === href ? "#03111b" : "#ccefff", background: currentPath === href ? "linear-gradient(135deg,#72dcff,#42b9ef)" : "rgba(45,160,220,.1)", border: "1px solid rgba(89,203,255,.3)", borderRadius: 12, padding: "9px 11px", fontWeight: 850, fontSize: 13 }}><span>{label}</span><span aria-hidden="true" style={{ opacity: .75 }}>{currentPath === href ? "●" : "›"}</span></a>)}
        </div>}
      </nav>

      <section style={panel}>{children}</section>
    </div>
  </main>;
}
