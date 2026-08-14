"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type RepresentativeWidgetProps = {
  title?: string;
  greeting?: string;
  position?: "left" | "right";
  compact?: boolean;
};

type ShopRecommendation = {
  id: string | number;
  merchant: string;
  title: string;
  category: string;
  description: string;
  affiliateUrl: string;
  reason?: string;
};

export default function RepresentativeWidget({
  title = "WASCIK Digital Representative",
  greeting = "Hi. What can I help you with today?",
  position = "right",
  compact = false,
}: RepresentativeWidgetProps) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState(greeting);
  const [recommendations, setRecommendations] = useState<ShopRecommendation[]>([]);
  const [disclosure, setDisclosure] = useState("");
  const [loading, setLoading] = useState(false);

  const affiliateMode = useMemo(() => pathname.startsWith("/affiliate-services"), [pathname]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) return;

    setLoading(true);
    setRecommendations([]);
    setDisclosure("");

    try {
      if (affiliateMode) {
        const response = await fetch("/api/ai-funnel/shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: cleanMessage, pathname }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "The shopping assistant could not respond.");
        setReply(data.guidance || "Here are the strongest matches I found from the current WASCIK catalog.");
        setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
        setDisclosure(typeof data.disclosure === "string" ? data.disclosure : "");
      } else {
        const response = await fetch("/api/ai-funnel/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: cleanMessage, pathname }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "The representative could not respond.");
        setReply(data.text || "How else can I help?");
      }
      setMessage("");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "The representative could not respond.");
    } finally {
      setLoading(false);
    }
  }

  const sideStyle = position === "left" ? { left: 18 } : { right: 18 };

  return (
    <aside style={{ position: "fixed", bottom: 18, zIndex: 70, ...sideStyle, width: compact ? 310 : "min(390px, calc(100vw - 36px))", fontFamily: "inherit" }}>
      {open ? (
        <div style={{ border: "1px solid rgba(126,198,255,.25)", borderRadius: 26, overflow: "hidden", background: "rgba(5,13,24,.97)", color: "white", boxShadow: "0 24px 80px rgba(0,0,0,.45)", backdropFilter: "blur(18px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <div aria-hidden="true" style={{ width: 44, height: 54, borderRadius: "20px 20px 16px 16px", background: "linear-gradient(160deg,#d8e6f1,#71849d)", position: "relative", flex: "0 0 auto" }}>
              <span style={{ position: "absolute", left: 10, top: 22, width: 5, height: 5, borderRadius: 99, background: "#0b2748" }} />
              <span style={{ position: "absolute", right: 10, top: 22, width: 5, height: 5, borderRadius: 99, background: "#0b2748" }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong style={{ display: "block", fontSize: 14 }}>{title}</strong>
              <span style={{ color: "#7fd7ff", fontSize: 11, fontWeight: 800 }}>{affiliateMode ? "SHOPPING GUIDE" : "WEBSITE REPRESENTATIVE"}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close representative" style={{ width: 34, height: 34, borderRadius: 99, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "white", cursor: "pointer" }}>×</button>
          </div>

          <div style={{ maxHeight: "58vh", overflowY: "auto", padding: 16 }}>
            <div style={{ borderRadius: 18, background: "rgba(255,255,255,.055)", padding: 14, color: "#d9e7f4", lineHeight: 1.55, fontSize: 14 }}>{reply}</div>

            {recommendations.length > 0 ? (
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {recommendations.map((item) => (
                  <article key={`${item.merchant}-${item.id}`} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 13, background: "rgba(255,255,255,.025)" }}>
                    <span style={{ color: "#7fd7ff", fontSize: 10, fontWeight: 900, letterSpacing: ".08em" }}>{item.merchant.toUpperCase()}</span>
                    <strong style={{ display: "block", marginTop: 5, fontSize: 14 }}>{item.title}</strong>
                    <p style={{ margin: "7px 0", color: "#9fb0c3", fontSize: 12, lineHeight: 1.5 }}>{item.reason ? `Why it fits: ${item.reason}` : item.description}</p>
                    <a href={item.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: 36, padding: "0 12px", borderRadius: 999, background: "#2a78f6", color: "white", fontSize: 12, fontWeight: 900, textDecoration: "none" }}>View option ↗</a>
                  </article>
                ))}
              </div>
            ) : null}

            {disclosure ? <p style={{ margin: "12px 2px 0", color: "#7f91a5", fontSize: 10, lineHeight: 1.45 }}>{disclosure}</p> : null}
          </div>

          <form onSubmit={send} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid rgba(255,255,255,.08)" }}>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={affiliateMode ? "What are you shopping for?" : "Ask me about this page..."} style={{ minWidth: 0, flex: 1, border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, background: "rgba(255,255,255,.05)", color: "white", padding: "11px 14px", outline: "none" }} />
            <button type="submit" disabled={loading} aria-label="Send message" style={{ width: 42, height: 42, borderRadius: 99, border: 0, background: "linear-gradient(135deg,#2d78ff,#09b7ca)", color: "white", fontWeight: 900, cursor: "pointer", opacity: loading ? .65 : 1 }}>{loading ? "…" : "→"}</button>
          </form>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{ marginLeft: position === "right" ? "auto" : 0, display: "flex", alignItems: "center", gap: 10, minHeight: 58, border: "1px solid rgba(126,198,255,.28)", borderRadius: 999, padding: "8px 16px 8px 9px", background: "rgba(5,13,24,.96)", color: "white", boxShadow: "0 18px 50px rgba(0,0,0,.35)", cursor: "pointer" }}>
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 99, background: "linear-gradient(135deg,#2c72ff,#09b7ca)", fontWeight: 900 }}>W</span>
          <span style={{ textAlign: "left" }}><strong style={{ display: "block", fontSize: 13 }}>Ask WASCIK</strong><small style={{ color: "#92a8bd" }}>{affiliateMode ? "Find the right product" : "How can I help?"}</small></span>
        </button>
      )}
    </aside>
  );
}
