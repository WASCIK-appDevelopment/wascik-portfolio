"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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

type ConversationTurn = { role: "user" | "assistant"; content: string };
type LeadProfile = Record<string, unknown>;
type LeadQualification = {
  profile?: LeadProfile;
  score?: number;
  status?: "discovery" | "qualifying" | "handoff-ready";
  missingFields?: string[];
};

const SESSION_KEY = "wascik-ai-session-v1";


function WascikRepresentativeCharacter({ compact = false }: { compact?: boolean }) {
  const scale = compact ? 0.66 : 1;
  return (
    <span
      aria-hidden="true"
      style={{
        position: "relative",
        display: "block",
        width: compact ? 52 : 78,
        height: compact ? 112 : 218,
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: compact ? -13 : 0,
          bottom: compact ? -43 : 0,
          width: 78,
          height: 218,
          transform: "scale(" + scale + ")",
          transformOrigin: "bottom center",
        }}
      >
        <span style={{ position: "absolute", bottom: 0, left: 4, width: 70, height: 14, borderRadius: "50%", background: "rgba(0,0,0,.34)", filter: "blur(6px)" }} />

        <span style={{ position: "absolute", top: 7, left: 18, width: 42, height: 50, borderRadius: "48% 48% 44% 44%", background: "linear-gradient(145deg,#e0b797,#a96f4f)", boxShadow: "inset -5px -5px 9px rgba(88,43,25,.16)", zIndex: 4 }}>
          <span style={{ position: "absolute", left: -4, top: 21, width: 7, height: 13, borderRadius: "60% 25% 25% 60%", background: "#b87d5b", boxShadow: "inset -2px 0 2px rgba(81,42,28,.24)" }} />
          <span style={{ position: "absolute", right: -4, top: 21, width: 7, height: 13, borderRadius: "25% 60% 60% 25%", background: "#b87d5b", boxShadow: "inset 2px 0 2px rgba(81,42,28,.24)" }} />

          <span style={{ position: "absolute", left: 7, top: 18, width: 10, height: 2, borderRadius: 99, background: "#442e26", transform: "rotate(-4deg)" }} />
          <span style={{ position: "absolute", right: 7, top: 18, width: 10, height: 2, borderRadius: 99, background: "#442e26", transform: "rotate(4deg)" }} />
          <span style={{ position: "absolute", left: 9, top: 22, width: 7, height: 5, borderRadius: "50%", background: "#f7f8fb", boxShadow: "0 0 0 1px rgba(61,31,23,.18)" }}>
            <span style={{ position: "absolute", left: 2, top: 1, width: 3, height: 3, borderRadius: "50%", background: "#163d57" }} />
          </span>
          <span style={{ position: "absolute", right: 9, top: 22, width: 7, height: 5, borderRadius: "50%", background: "#f7f8fb", boxShadow: "0 0 0 1px rgba(61,31,23,.18)" }}>
            <span style={{ position: "absolute", right: 2, top: 1, width: 3, height: 3, borderRadius: "50%", background: "#163d57" }} />
          </span>

          <span style={{ position: "absolute", left: 19, top: 25, width: 5, height: 10, borderRadius: "40% 50% 55% 45%", borderRight: "1.5px solid rgba(91,45,30,.55)", borderBottom: "1px solid rgba(91,45,30,.3)", transform: "rotate(4deg)" }} />
          <span style={{ position: "absolute", left: 14, top: 38, width: 15, height: 6, borderBottom: "2px solid #6d382c", borderRadius: "50%", transform: "rotate(-2deg)" }} />
        </span>

        <span style={{ position: "absolute", top: 1, left: 14, width: 50, height: 30, borderRadius: "58% 58% 30% 30%", background: "linear-gradient(145deg,#17202f,#425069)", clipPath: "polygon(4% 100%,0 36%,14% 10%,37% 0,68% 6%,94% 25%,100% 100%,83% 61%,73% 29%,58% 42%,43% 25%,25% 45%,17% 76%)", zIndex: 5 }} />
        <span style={{ position: "absolute", top: 51, left: 31, width: 16, height: 15, background: "linear-gradient(#c58b69,#a86e50)", zIndex: 2 }} />

        <span style={{ position: "absolute", top: 64, left: 9, width: 60, height: 91, borderRadius: "20px 20px 12px 12px", background: "linear-gradient(165deg,#1c3150,#07111f 78%)", border: "1px solid rgba(89,183,255,.42)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.08),0 8px 20px rgba(0,0,0,.24)" }}>
          <span style={{ position: "absolute", left: 16, top: 16, width: 28, height: 28, borderRadius: 8, background: "linear-gradient(145deg,rgba(6,15,28,.96),rgba(22,61,102,.96))", border: "1px solid rgba(126,204,255,.42)", boxShadow: "0 0 13px rgba(28,143,255,.24)", overflow: "hidden", display: "grid", placeItems: "center" }}>
            <img src="/wascik-logo-v2.png" alt="" style={{ width: 34, height: 34, objectFit: "contain", filter: "drop-shadow(0 0 3px rgba(90,190,255,.5))" }} />
          </span>
          <span style={{ position: "absolute", left: 11, right: 11, bottom: 14, height: 1, background: "linear-gradient(90deg,transparent,#39b9ff,transparent)", opacity: .55 }} />
        </span>

        <span style={{ position: "absolute", top: 71, left: 0, width: 15, height: 82, borderRadius: 12, background: "linear-gradient(#1b304e,#081321)", transform: "rotate(5deg)", transformOrigin: "top", borderLeft: "1px solid rgba(89,183,255,.18)" }} />
        <span style={{ position: "absolute", top: 71, right: 0, width: 15, height: 82, borderRadius: 12, background: "linear-gradient(#1b304e,#081321)", transform: "rotate(-5deg)", transformOrigin: "top", borderRight: "1px solid rgba(89,183,255,.18)" }} />
        <span style={{ position: "absolute", top: 153, left: 17, width: 18, height: 59, borderRadius: "0 0 11px 11px", background: "linear-gradient(#0b1727,#02060d)" }} />
        <span style={{ position: "absolute", top: 153, right: 17, width: 18, height: 59, borderRadius: "0 0 11px 11px", background: "linear-gradient(#0b1727,#02060d)" }} />
      </span>
    </span>
  );
}

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
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [lead, setLead] = useState<LeadProfile>({});
  const [leadStatus, setLeadStatus] = useState<LeadQualification["status"]>();
  const [recommendations, setRecommendations] = useState<ShopRecommendation[]>([]);
  const [disclosure, setDisclosure] = useState("");
  const [loading, setLoading] = useState(false);
  const affiliateMode = useMemo(() => pathname.startsWith("/affiliate-services"), [pathname]);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { history?: ConversationTurn[]; lead?: LeadProfile; leadStatus?: LeadQualification["status"] };
      if (Array.isArray(parsed.history)) {
        const clean = parsed.history
          .filter((turn) => turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
          .slice(-10);
        setHistory(clean);
        const latestAssistant = [...clean].reverse().find((turn) => turn.role === "assistant");
        if (latestAssistant) setReply(latestAssistant.content);
      }
      if (parsed.lead && typeof parsed.lead === "object") setLead(parsed.lead);
      if (parsed.leadStatus) setLeadStatus(parsed.leadStatus);
    } catch {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  function saveSession(nextHistory: ConversationTurn[], nextLead: LeadProfile, nextStatus?: LeadQualification["status"]) {
    const trimmedHistory = nextHistory.slice(-10);
    setHistory(trimmedHistory);
    setLead(nextLead);
    setLeadStatus(nextStatus);
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ history: trimmedHistory, lead: nextLead, leadStatus: nextStatus }));
    } catch {
      // Session persistence is an enhancement; conversation still works if storage is unavailable.
    }
  }

  function clearSession() {
    setHistory([]);
    setLead({});
    setLeadStatus(undefined);
    setReply(greeting);
    setRecommendations([]);
    setDisclosure("");
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }

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
        const responseText = data.guidance || "Here are the strongest matches I found from the current WASCIK catalog.";
        setReply(responseText);
        setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
        setDisclosure(typeof data.disclosure === "string" ? data.disclosure : "");
        saveSession([...history, { role: "user", content: cleanMessage }, { role: "assistant", content: responseText }], lead, leadStatus);
      } else {
        const response = await fetch("/api/ai-funnel/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: cleanMessage, pathname, history, lead }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "The representative could not respond.");
        const responseText = data.text || "How else can I help?";
        const qualification = data.leadQualification as LeadQualification | undefined;
        const nextLead = qualification?.profile && typeof qualification.profile === "object" ? qualification.profile : lead;
        setReply(responseText);
        saveSession(
          [...history, { role: "user", content: cleanMessage }, { role: "assistant", content: responseText }],
          nextLead,
          qualification?.status
        );
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
    <aside aria-label={title} style={{ position: "fixed", bottom: 3, zIndex: 70, ...sideStyle, width: compact ? 282 : "min(360px, calc(100vw - 12px))", fontFamily: "inherit", pointerEvents: "none" }}>
      {open ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 82px", alignItems: "end", gap: 5, pointerEvents: "auto" }}>
          <div style={{ minWidth: 0, paddingBottom: 38 }}>
            <div style={{ position: "relative", border: "1px solid rgba(126,198,255,.28)", borderRadius: 21, background: "rgba(5,13,24,.97)", color: "white", boxShadow: "0 18px 56px rgba(0,0,0,.4)", backdropFilter: "blur(18px)", overflow: "visible" }}>
              <span aria-hidden="true" style={{ position: "absolute", bottom: 28, [bubbleTailSide]: -10, width: 19, height: 19, background: "rgba(5,13,24,.97)", borderRight: bubbleTailSide === "right" ? "1px solid rgba(126,198,255,.28)" : undefined, borderBottom: bubbleTailSide === "right" ? "1px solid rgba(126,198,255,.28)" : undefined, borderLeft: bubbleTailSide === "left" ? "1px solid rgba(126,198,255,.28)" : undefined, borderTop: bubbleTailSide === "left" ? "1px solid rgba(126,198,255,.28)" : undefined, transform: "rotate(45deg)" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 12px 8px" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: "block", fontSize: 12 }}>{title}</strong>
                  <span style={{ color: "#7fd7ff", fontSize: 9, fontWeight: 900, letterSpacing: ".07em" }}>{affiliateMode ? "SHOPPING GUIDE" : "WEBSITE REPRESENTATIVE"}</span>
                  {!affiliateMode && leadStatus ? <span style={{ display: "block", marginTop: 2, color: leadStatus === "handoff-ready" ? "#8ff0b6" : "#92a8bd", fontSize: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>{leadStatus === "handoff-ready" ? "Project details ready" : "Remembering this conversation"}</span> : null}
                </div>
                <button type="button" onClick={clearSession} aria-label="Start a new conversation" title="Start a new conversation" style={{ width: 27, height: 27, borderRadius: 99, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "#b8c7d7", cursor: "pointer", fontSize: 11 }}>↺</button>
                <button type="button" onClick={() => setOpen(false)} aria-label="Minimize representative" style={{ width: 27, height: 27, borderRadius: 99, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: "white", cursor: "pointer" }}>−</button>
              </div>

              <div style={{ maxHeight: "39vh", overflowY: "auto", padding: "0 12px 10px" }}>
                <div style={{ borderRadius: 16, background: "rgba(255,255,255,.055)", padding: 11, color: "#d9e7f4", lineHeight: 1.5, fontSize: 12 }}>{loading ? "Give me a second..." : reply}</div>
                {recommendations.length > 0 ? <div style={{ display: "grid", gap: 8, marginTop: 8 }}>{recommendations.map((item) => <article key={`${item.merchant}-${item.id}`} style={{ border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: 10, background: "rgba(255,255,255,.025)" }}><span style={{ color: "#7fd7ff", fontSize: 8, fontWeight: 900, letterSpacing: ".08em" }}>{item.merchant.toUpperCase()}</span><strong style={{ display: "block", marginTop: 4, fontSize: 12 }}>{item.title}</strong><p style={{ margin: "5px 0", color: "#9fb0c3", fontSize: 10, lineHeight: 1.4 }}>{item.reason ? `Why it fits: ${item.reason}` : item.description}</p><a href={item.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: 31, padding: "0 10px", borderRadius: 999, background: "#2a78f6", color: "white", fontSize: 10, fontWeight: 900, textDecoration: "none" }}>View option ↗</a></article>)}</div> : null}
                {disclosure ? <p style={{ margin: "8px 2px 0", color: "#7f91a5", fontSize: 8, lineHeight: 1.35 }}>{disclosure}</p> : null}
              </div>

              <form onSubmit={send} style={{ display: "flex", gap: 6, padding: 9, borderTop: "1px solid rgba(255,255,255,.08)" }}>
                <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={affiliateMode ? "What are you shopping for?" : "Type your reply..."} style={{ minWidth: 0, flex: 1, border: "1px solid rgba(255,255,255,.1)", borderRadius: 999, background: "rgba(255,255,255,.05)", color: "white", padding: "9px 11px", outline: "none", fontSize: 12 }} />
                <button type="submit" disabled={loading} aria-label="Send message" style={{ width: 36, height: 36, borderRadius: 99, border: 0, background: "linear-gradient(135deg,#2d78ff,#09b7ca)", color: "white", fontWeight: 900, cursor: "pointer", opacity: loading ? .65 : 1 }}>{loading ? "…" : "→"}</button>
              </form>
            </div>
          </div>

          <div style={{ position: "relative", height: 218, display: "flex", alignItems: "end", justifyContent: "center" }}>
            <WascikRepresentativeCharacter />
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={{ pointerEvents: "auto", marginLeft: position === "right" ? "auto" : 0, display: "flex", alignItems: "end", gap: 6, border: 0, background: "transparent", color: "white", cursor: "pointer" }}>
          <span style={{ maxWidth: 170, border: "1px solid rgba(126,198,255,.28)", borderRadius: 16, padding: "8px 10px", background: "rgba(5,13,24,.96)", boxShadow: "0 14px 38px rgba(0,0,0,.34)", fontSize: 11, textAlign: "left" }}><strong style={{ display: "block" }}>{affiliateMode ? "Need help choosing?" : leadStatus === "handoff-ready" ? "Ready to continue?" : "Need some help?"}</strong><small style={{ color: "#92a8bd" }}>{history.length ? "Tap to continue your conversation." : "Tap to talk with the WASCIK representative."}</small></span>
          <WascikRepresentativeCharacter compact />
        </button>
      )}
    </aside>
  );
}
