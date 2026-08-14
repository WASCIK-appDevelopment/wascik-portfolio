"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type RepresentativeWidgetProps = {
  title?: string;
  greeting?: string;
  position?: "left" | "right";
  compact?: boolean;
  defaultOpen?: boolean;
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
  defaultOpen = false,
}: RepresentativeWidgetProps) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(defaultOpen);
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

  const sideStyle = position === "left" ? { left: 10 } : { right: 8 };
  const bubbleTailSide = position === "left" ? "left" : "right";

  return (
    <aside
      aria-label={title}
      style={{
        position: "fixed",
        bottom: 3,
        zIndex: 70,
        ...sideStyle,
        width: compact ? 282 : "min(360px, calc(100vw - 12px))",
        fontFamily: "inherit",
        pointerEvents: "none",
      }}
    >
      {open ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 82px", alignItems: "end", gap: 5, pointerEvents: "auto" }}>
          <div style={{ minWidth: 0, paddingBottom: 38 }}>
            <div
              style={{
                position: "relative",
                border: "1px solid rgba(126,198,255,.28)",
                borderRadius: 21,
                background: "rgba(5,13,24,.97)",
                color: "white",
                boxShadow: "0 18px 56px rgba(0,0,0,.4)",
                backdropFilter: "blur(18px)",
                overflow: "visible",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: 28,
                  [bubbleTailSide]: -10,
                  width: 19,
                  height: 19,
                  background: "rgba(5,13,24,.97)",
                  borderRight: bubbleTailSide === "right" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  borderBottom: bubbleTailSide === "right" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  borderLeft: bubbleTailSide === "left" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  borderTop: bubbleTailSide === "left" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  transform: "rotate(45deg)",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 12px 8px" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 12 }}>{title}</strong>
                  <span style={{ color: "#7fd7ff", fontSize: 9, fontWeight: 900, letterSpacing: ".07em" }}>
                    {affiliateMode ? "SHOPPING GUIDE" : "WEBSITE REPRESENTATIVE"}
                  </span>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Minimize representative" style={{ width: 27, height: 27, borderRadius: 99, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "white", cursor: "pointer" }}>−</button>
              </div>

              <div style={{ maxHeight: "39vh", overflowY: "auto", padding: "0 12px 10px" }}>
                <div style={{ borderRadius: 16, background: "rgba(255,255,255,.055)", padding: 11, color: "#d9e7f4", lineHeight: 1.5, fontSize: 12 }}>
                  {loading ? "Give me a second..." : reply}
                </div>

                {recommendations.length > 0 ? (
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    {recommendations.map((item) => (
                      <article key={`${item.merchant}-${item.id}`} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 10, background: "rgba(255,255,255,.025)" }}>
                        <span style={{ color: "#7fd7ff", fontSize: 8, fontWeight: 900, letterSpacing: ".08em" }}>{item.merchant.toUpperCase()}</span>
                        <strong style={{ display: "block", marginTop: 4, fontSize: 12 }}>{item.title}</strong>
                        <p style={{ margin: "5px 0", color: "#9fb0c3", fontSize: 10, lineHeight: 1.4 }}>{item.reason ? `Why it fits: ${item.reason}` : item.description}</p>
                        <a href={item.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: 31, padding: "0 10px", borderRadius: 999, background: "#2a78f6", color: "white", fontSize: 10, fontWeight: 900, textDecoration: "none" }}>View option ↗</a>
                      </article>
                    ))}
                  </div>
                ) : null}

                {disclosure ? <p style={{ margin: "8px 2px 0", color: "#7f91a5", fontSize: 8, lineHeight: 1.35 }}>{disclosure}</p> : null}
              </div>

              <form onSubmit={send} style={{ display: "flex", gap: 6, padding: 9, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={affiliateMode ? "What are you shopping for?" : "Type your reply..."} style={{ minWidth: 0, flex: 1, border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, background: "rgba(255,255,255,.05)", color: "white", padding: "9px 11px", outline: "none", fontSize: 12 }} />
                <button type="submit" disabled={loading} aria-label="Send message" style={{ width: 36, height: 36, borderRadius: 99, border: 0, background: "linear-gradient(135deg,#2d78ff,#09b7ca)", color: "white", fontWeight: 900, cursor: "pointer", opacity: loading ? .65 : 1 }}>{loading ? "…" : "→"}</button>
              </form>
            </div>
          </div>

          <div style={{ position: "relative", height: 218, display: "flex", alignItems: "end", justifyContent: "center" }} aria-hidden="true">
            <div style={{ position: "absolute", bottom: 0, width: 70, height: 14, borderRadius: "50%", background: "rgba(0,0,0,.34)", filter: "blur(6px)" }} />
            <div style={{ position: "relative", width: 72, height: 205 }}>
              <div style={{ position: "absolute", top: 0, left: 18, width: 38, height: 46, borderRadius: "48% 48% 44% 44%", background: "linear-gradient(160deg,#d7b18f,#a97152)", zIndex: 3 }}>
                <span style={{ position: "absolute", left: 8, top: 19, width: 4, height: 3, borderRadius: 99, background: "#1e2b3a" }} />
                <span style={{ position: "absolute", right: 8, top: 19, width: 4, height: 3, borderRadius: 99, background: "#1e2b3a" }} />
                <span style={{ position: "absolute", left: 15, top: 31, width: 10, height: 4, borderBottom: "2px solid rgba(81,42,28,.8)", borderRadius: "50%" }} />
              </div>
              <div style={{ position: "absolute", top: -4, left: 14, width: 46, height: 28, borderRadius: "55% 55% 32% 32%", background: "linear-gradient(145deg,#1a2230,#39465a)", zIndex: 4 }} />
              <div style={{ position: "absolute", top: 42, left: 29, width: 16, height: 15, background: "#b98261", zIndex: 2 }} />
              <div style={{ position: "absolute", top: 55, left: 9, width: 56, height: 94, borderRadius: "18px 18px 11px 11px", background: "linear-gradient(165deg,#17263d,#07111f)", border: "1px solid rgba(89,183,255,.35)" }}>
                <span style={{ position: "absolute", top: 20, left: 21, width: 14, height: 14, borderRadius: 4, background: "linear-gradient(135deg,#2e75ff,#0cb5c9)", display: "grid", placeItems: "center", color: "white", fontSize: 8, fontWeight: 900 }}>W</span>
              </div>
              <div style={{ position: "absolute", top: 61, left: 0, width: 14, height: 84, borderRadius: 12, background: "linear-gradient(#17263d,#0a1422)", transform: "rotate(5deg)", transformOrigin: "top" }} />
              <div style={{ position: "absolute", top: 61, right: 0, width: 14, height: 84, borderRadius: 12, background: "linear-gradient(#17263d,#0a1422)", transform: "rotate(-5deg)", transformOrigin: "top" }} />
              <div style={{ position: "absolute", top: 145, left: 16, width: 17, height: 59, borderRadius: "0 0 11px 11px", background: "linear-gradient(#0a1422,#030711)" }} />
              <div style={{ position: "absolute", top: 145, right: 16, width: 17, height: 59, borderRadius: "0 0 11px 11px", background: "linear-gradient(#0a1422,#030711)" }} />
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{ pointerEvents: "auto", marginLeft: position === "right" ? "auto" : 0, display: "flex", alignItems: "end", gap: 6, border: 0, background: "transparent", color: "white", cursor: "pointer" }}>
          <span style={{ maxWidth: 170, border: "1px solid rgba(126,198,255,.28)", borderRadius: 16, padding: "8px 10px", background: "rgba(5,13,24,.96)", boxShadow: "0 14px 38px rgba(0,0,0,.34)", fontSize: 11, textAlign: "left" }}>
            <strong style={{ display: "block" }}>{affiliateMode ? "Need help choosing?" : "Need some help?"}</strong>
            <small style={{ color: "#92a8bd" }}>Tap to talk with the WASCIK representative.</small>
          </span>
          <span aria-hidden="true" style={{ position: "relative", display: "block", width: 48, height: 98 }}>
            <span style={{ position: "absolute", top: 0, left: 11, width: 26, height: 31, borderRadius: "48%", background: "#bb8968" }} />
            <span style={{ position: "absolute", top: -2, left: 8, width: 32, height: 19, borderRadius: "55% 55% 30% 30%", background: "#263246" }} />
            <span style={{ position: "absolute", top: 28, left: 5, width: 38, height: 49, borderRadius: "12px 12px 8px 8px", background: "linear-gradient(165deg,#17263d,#07111f)", border: "1px solid rgba(89,183,255,.35)" }} />
            <span style={{ position: "absolute", top: 75, left: 10, width: 11, height: 23, background: "#050a13" }} />
            <span style={{ position: "absolute", top: 75, right: 10, width: 11, height: 23, background: "#050a13" }} />
          </span>
        </button>
      )}
    </aside>
  );
}
