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
  const [open, setOpen] = useState(true);
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

  const sideStyle = position === "left" ? { left: 14 } : { right: 14 };
  const bubbleTailSide = position === "left" ? "left" : "right";

  return (
    <aside
      aria-label={title}
      style={{
        position: "fixed",
        bottom: 8,
        zIndex: 70,
        ...sideStyle,
        width: compact ? 300 : "min(430px, calc(100vw - 24px))",
        fontFamily: "inherit",
        pointerEvents: "none",
      }}
    >
      {open ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 112px", alignItems: "end", gap: 8, pointerEvents: "auto" }}>
          <div style={{ minWidth: 0, paddingBottom: 54 }}>
            <div
              style={{
                position: "relative",
                border: "1px solid rgba(126,198,255,.28)",
                borderRadius: 24,
                background: "rgba(5,13,24,.97)",
                color: "white",
                boxShadow: "0 22px 70px rgba(0,0,0,.42)",
                backdropFilter: "blur(18px)",
                overflow: "visible",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: 34,
                  [bubbleTailSide]: -13,
                  width: 24,
                  height: 24,
                  background: "rgba(5,13,24,.97)",
                  borderRight: bubbleTailSide === "right" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  borderBottom: bubbleTailSide === "right" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  borderLeft: bubbleTailSide === "left" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  borderTop: bubbleTailSide === "left" ? "1px solid rgba(126,198,255,.28)" : undefined,
                  transform: "rotate(45deg)",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 14px 10px" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 13 }}>{title}</strong>
                  <span style={{ color: "#7fd7ff", fontSize: 10, fontWeight: 900, letterSpacing: ".08em" }}>
                    {affiliateMode ? "SHOPPING GUIDE" : "WEBSITE REPRESENTATIVE"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Minimize representative"
                  style={{ width: 30, height: 30, borderRadius: 99, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "white", cursor: "pointer" }}
                >
                  −
                </button>
              </div>

              <div style={{ maxHeight: "46vh", overflowY: "auto", padding: "0 14px 12px" }}>
                <div style={{ borderRadius: 18, background: "rgba(255,255,255,.055)", padding: 13, color: "#d9e7f4", lineHeight: 1.55, fontSize: 13 }}>
                  {loading ? "Give me a second..." : reply}
                </div>

                {recommendations.length > 0 ? (
                  <div style={{ display: "grid", gap: 9, marginTop: 10 }}>
                    {recommendations.map((item) => (
                      <article key={`${item.merchant}-${item.id}`} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 15, padding: 11, background: "rgba(255,255,255,.025)" }}>
                        <span style={{ color: "#7fd7ff", fontSize: 9, fontWeight: 900, letterSpacing: ".08em" }}>{item.merchant.toUpperCase()}</span>
                        <strong style={{ display: "block", marginTop: 4, fontSize: 13 }}>{item.title}</strong>
                        <p style={{ margin: "6px 0", color: "#9fb0c3", fontSize: 11, lineHeight: 1.45 }}>{item.reason ? `Why it fits: ${item.reason}` : item.description}</p>
                        <a href={item.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: 34, padding: "0 11px", borderRadius: 999, background: "#2a78f6", color: "white", fontSize: 11, fontWeight: 900, textDecoration: "none" }}>View option ↗</a>
                      </article>
                    ))}
                  </div>
                ) : null}

                {disclosure ? <p style={{ margin: "10px 2px 0", color: "#7f91a5", fontSize: 9, lineHeight: 1.4 }}>{disclosure}</p> : null}
              </div>

              <form onSubmit={send} style={{ display: "flex", gap: 7, padding: 10, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={affiliateMode ? "What are you shopping for?" : "Type your reply..."}
                  style={{ minWidth: 0, flex: 1, border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, background: "rgba(255,255,255,.05)", color: "white", padding: "10px 12px", outline: "none", fontSize: 13 }}
                />
                <button type="submit" disabled={loading} aria-label="Send message" style={{ width: 40, height: 40, borderRadius: 99, border: 0, background: "linear-gradient(135deg,#2d78ff,#09b7ca)", color: "white", fontWeight: 900, cursor: "pointer", opacity: loading ? .65 : 1 }}>
                  {loading ? "…" : "→"}
                </button>
              </form>
            </div>
          </div>

          <div style={{ position: "relative", height: 270, display: "flex", alignItems: "end", justifyContent: "center" }} aria-hidden="true">
            <div style={{ position: "absolute", bottom: 0, width: 92, height: 18, borderRadius: "50%", background: "rgba(0,0,0,.34)", filter: "blur(7px)" }} />
            <div style={{ position: "relative", width: 92, height: 250 }}>
              <div style={{ position: "absolute", top: 0, left: 23, width: 48, height: 57, borderRadius: "48% 48% 44% 44%", background: "linear-gradient(160deg,#d7b18f,#a97152)", zIndex: 3, boxShadow: "inset 0 -8px 12px rgba(88,42,24,.15)" }}>
                <span style={{ position: "absolute", left: 10, top: 23, width: 5, height: 4, borderRadius: 99, background: "#1e2b3a" }} />
                <span style={{ position: "absolute", right: 10, top: 23, width: 5, height: 4, borderRadius: 99, background: "#1e2b3a" }} />
                <span style={{ position: "absolute", left: 19, top: 39, width: 12, height: 5, borderBottom: "2px solid rgba(81,42,28,.8)", borderRadius: "50%" }} />
              </div>
              <div style={{ position: "absolute", top: -5, left: 18, width: 58, height: 35, borderRadius: "55% 55% 32% 32%", background: "linear-gradient(145deg,#1a2230,#39465a)", zIndex: 4 }} />
              <div style={{ position: "absolute", top: 52, left: 37, width: 20, height: 18, background: "#b98261", zIndex: 2 }} />
              <div style={{ position: "absolute", top: 67, left: 11, width: 72, height: 116, borderRadius: "23px 23px 14px 14px", background: "linear-gradient(165deg,#17263d,#07111f)", border: "1px solid rgba(89,183,255,.35)", boxShadow: "0 8px 20px rgba(0,0,0,.28)" }}>
                <span style={{ position: "absolute", top: 23, left: 28, width: 16, height: 16, borderRadius: 5, background: "linear-gradient(135deg,#2e75ff,#0cb5c9)", display: "grid", placeItems: "center", color: "white", fontSize: 9, fontWeight: 900 }}>W</span>
                <span style={{ position: "absolute", top: 0, left: 20, width: 16, height: 30, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "29px solid rgba(255,255,255,.08)" }} />
              </div>
              <div style={{ position: "absolute", top: 75, left: 0, width: 18, height: 104, borderRadius: 14, background: "linear-gradient(#17263d,#0a1422)", transform: "rotate(5deg)", transformOrigin: "top" }} />
              <div style={{ position: "absolute", top: 75, right: 0, width: 18, height: 104, borderRadius: 14, background: "linear-gradient(#17263d,#0a1422)", transform: "rotate(-5deg)", transformOrigin: "top" }} />
              <div style={{ position: "absolute", top: 179, left: 20, width: 22, height: 70, borderRadius: "0 0 13px 13px", background: "linear-gradient(#0a1422,#030711)" }} />
              <div style={{ position: "absolute", top: 179, right: 20, width: 22, height: 70, borderRadius: "0 0 13px 13px", background: "linear-gradient(#0a1422,#030711)" }} />
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            pointerEvents: "auto",
            marginLeft: position === "right" ? "auto" : 0,
            display: "flex",
            alignItems: "end",
            gap: 8,
            border: 0,
            background: "transparent",
            color: "white",
            cursor: "pointer",
          }}
        >
          <span style={{ maxWidth: 210, border: "1px solid rgba(126,198,255,.28)", borderRadius: 18, padding: "10px 12px", background: "rgba(5,13,24,.96)", boxShadow: "0 16px 44px rgba(0,0,0,.35)", fontSize: 12, textAlign: "left" }}>
            <strong style={{ display: "block" }}>{affiliateMode ? "Need help choosing?" : "Need some help?"}</strong>
            <small style={{ color: "#92a8bd" }}>Tap to talk with the WASCIK representative.</small>
          </span>
          <span aria-hidden="true" style={{ position: "relative", display: "block", width: 56, height: 116 }}>
            <span style={{ position: "absolute", top: 0, left: 13, width: 30, height: 36, borderRadius: "48%", background: "#bb8968" }} />
            <span style={{ position: "absolute", top: -3, left: 10, width: 36, height: 22, borderRadius: "55% 55% 30% 30%", background: "#263246" }} />
            <span style={{ position: "absolute", top: 33, left: 5, width: 46, height: 57, borderRadius: "14px 14px 9px 9px", background: "linear-gradient(165deg,#17263d,#07111f)", border: "1px solid rgba(89,183,255,.35)" }} />
            <span style={{ position: "absolute", top: 88, left: 12, width: 13, height: 28, background: "#050a13" }} />
            <span style={{ position: "absolute", top: 88, right: 12, width: 13, height: 28, background: "#050a13" }} />
          </span>
        </button>
      )}
    </aside>
  );
}
