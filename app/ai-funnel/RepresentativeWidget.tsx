"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type RepresentativeWidgetProps = {
  title?: string;
  greeting?: string;
  position?: "left" | "right";
};

type ShopRecommendation = {
  id: string | number;
  merchant: string;
  title: string;
  description: string;
  affiliateUrl: string;
  reason?: string;
};

export default function RepresentativeWidget({
  title = "WASCIK Digital Representative",
  greeting = "Hi. What can I help you with today?",
  position = "right",
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
      const endpoint = affiliateMode ? "/api/ai-funnel/shop" : "/api/ai-funnel/chat";
      const payload = affiliateMode
        ? { query: cleanMessage, pathname }
        : { message: cleanMessage, pathname };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The representative could not respond.");

      setReply(
        affiliateMode
          ? data.guidance || "Here are the strongest matches I found."
          : data.text || "How else can I help?",
      );

      if (affiliateMode) {
        setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
        setDisclosure(typeof data.disclosure === "string" ? data.disclosure : "");
      }
      setMessage("");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "The representative could not respond.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className={`wascik-rep wascik-rep-${position}`} aria-label={title}>
      {open ? (
        <div className="wascik-rep-stage">
          <section className="wascik-rep-bubble">
            <div className="wascik-rep-head">
              <div>
                <strong>{title}</strong>
                <span>{affiliateMode ? "SHOPPING GUIDE" : "WEBSITE REPRESENTATIVE"}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Minimize representative">−</button>
            </div>

            <div className="wascik-rep-scroll">
              <div className="wascik-rep-reply">{loading ? "Give me a second..." : reply}</div>

              {recommendations.map((item) => (
                <article key={`${item.merchant}-${item.id}`} className="wascik-rep-card">
                  <small>{item.merchant}</small>
                  <strong>{item.title}</strong>
                  <p>{item.reason || item.description}</p>
                  <a href={item.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer">View option ↗</a>
                </article>
              ))}

              {disclosure ? <p className="wascik-rep-disclosure">{disclosure}</p> : null}
            </div>

            <form onSubmit={send} className="wascik-rep-form">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={affiliateMode ? "What are you shopping for?" : "Type your reply..."}
              />
              <button type="submit" disabled={loading} aria-label="Send message">{loading ? "…" : "→"}</button>
            </form>
          </section>

          <div className="wascik-rep-person" aria-hidden="true">
            <div className="wascik-rep-shadow" />
            <div className="wascik-rep-avatar">
              <div className="wascik-rep-hair" />
              <div className="wascik-rep-face"><i /><i /><b /></div>
              <div className="wascik-rep-neck" />
              <div className="wascik-rep-body"><span>W</span></div>
              <div className="wascik-rep-arm wascik-rep-arm-left" />
              <div className="wascik-rep-arm wascik-rep-arm-right" />
              <div className="wascik-rep-leg wascik-rep-leg-left" />
              <div className="wascik-rep-leg wascik-rep-leg-right" />
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="wascik-rep-min" onClick={() => setOpen(true)}>
          <span>{affiliateMode ? "Need help choosing?" : "Need some help?"}<small>Tap to talk with the WASCIK representative.</small></span>
          <b>AI</b>
        </button>
      )}

      <style jsx>{`
        .wascik-rep{position:fixed;bottom:18px;z-index:70;width:min(430px,calc(100vw - 24px));font-family:inherit;pointer-events:none}
        .wascik-rep-right{right:14px}.wascik-rep-left{left:14px}
        .wascik-rep-stage{display:grid;grid-template-columns:minmax(0,1fr) 112px;align-items:end;gap:10px;pointer-events:auto}
        .wascik-rep-bubble{position:relative;margin-bottom:56px;border:1px solid rgba(126,198,255,.28);border-radius:24px;background:rgba(5,13,24,.97);color:#fff;box-shadow:0 22px 70px rgba(0,0,0,.42);backdrop-filter:blur(18px)}
        .wascik-rep-bubble:after{content:"";position:absolute;right:-11px;bottom:34px;width:20px;height:20px;background:rgba(5,13,24,.97);border-right:1px solid rgba(126,198,255,.28);border-bottom:1px solid rgba(126,198,255,.28);transform:rotate(-45deg)}
        .wascik-rep-head{display:flex;align-items:center;gap:10px;padding:13px 14px 10px}.wascik-rep-head>div{min-width:0;flex:1}.wascik-rep-head strong{display:block;font-size:13px}.wascik-rep-head span{display:block;margin-top:2px;color:#7fd7ff;font-size:10px;font-weight:900;letter-spacing:.08em}.wascik-rep-head button{width:30px;height:30px;border-radius:99px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff}
        .wascik-rep-scroll{max-height:42vh;overflow:auto;padding:0 14px 12px}.wascik-rep-reply{border-radius:18px;background:rgba(255,255,255,.055);padding:13px;color:#d9e7f4;line-height:1.5;font-size:13px}
        .wascik-rep-card{margin-top:9px;border:1px solid rgba(255,255,255,.08);border-radius:15px;padding:11px;background:rgba(255,255,255,.025)}.wascik-rep-card small{color:#7fd7ff;font-size:9px;font-weight:900;text-transform:uppercase}.wascik-rep-card strong{display:block;margin-top:4px;font-size:13px}.wascik-rep-card p{margin:6px 0;color:#9fb0c3;font-size:11px;line-height:1.45}.wascik-rep-card a{font-size:11px;font-weight:900;color:#fff}.wascik-rep-disclosure{font-size:9px;color:#7f91a5}
        .wascik-rep-form{display:flex;gap:7px;padding:10px;border-top:1px solid rgba(255,255,255,.08)}.wascik-rep-form input{min-width:0;flex:1;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.05);color:#fff;padding:10px 12px;font-size:13px}.wascik-rep-form button{width:40px;height:40px;border:0;border-radius:99px;background:linear-gradient(135deg,#2d78ff,#09b7ca);color:#fff;font-weight:900}
        .wascik-rep-person{position:relative;height:270px;display:flex;align-items:flex-end;justify-content:center}.wascik-rep-shadow{position:absolute;bottom:0;width:92px;height:18px;border-radius:50%;background:rgba(0,0,0,.34);filter:blur(7px)}.wascik-rep-avatar{position:relative;width:92px;height:250px}.wascik-rep-face{position:absolute;top:0;left:23px;width:48px;height:57px;border-radius:48% 48% 44% 44%;background:linear-gradient(160deg,#d7b18f,#a97152);z-index:3}.wascik-rep-hair{position:absolute;top:-5px;left:18px;width:58px;height:35px;border-radius:55% 55% 32% 32%;background:linear-gradient(145deg,#1a2230,#39465a);z-index:4}.wascik-rep-face i{position:absolute;top:23px;width:5px;height:4px;border-radius:99px;background:#1e2b3a}.wascik-rep-face i:first-child{left:10px}.wascik-rep-face i:nth-child(2){right:10px}.wascik-rep-face b{position:absolute;left:19px;top:39px;width:12px;height:5px;border-bottom:2px solid rgba(81,42,28,.8);border-radius:50%}.wascik-rep-neck{position:absolute;top:52px;left:37px;width:20px;height:18px;background:#b98261}.wascik-rep-body{position:absolute;top:67px;left:11px;width:72px;height:116px;border-radius:23px 23px 14px 14px;background:linear-gradient(165deg,#17263d,#07111f);border:1px solid rgba(89,183,255,.35)}.wascik-rep-body span{position:absolute;top:23px;left:28px;width:16px;height:16px;border-radius:5px;background:linear-gradient(135deg,#2e75ff,#0cb5c9);display:grid;place-items:center;font-size:9px;font-weight:900}.wascik-rep-arm{position:absolute;top:75px;width:18px;height:104px;border-radius:14px;background:linear-gradient(#17263d,#0a1422)}.wascik-rep-arm-left{left:0;transform:rotate(5deg)}.wascik-rep-arm-right{right:0;transform:rotate(-5deg)}.wascik-rep-leg{position:absolute;top:179px;width:22px;height:70px;border-radius:0 0 13px 13px;background:linear-gradient(#0a1422,#030711)}.wascik-rep-leg-left{left:20px}.wascik-rep-leg-right{right:20px}
        .wascik-rep-min{pointer-events:auto;margin-left:auto;display:flex;align-items:center;gap:10px;border:1px solid rgba(126,198,255,.28);border-radius:999px;background:rgba(5,13,24,.96);color:#fff;padding:9px 10px 9px 14px}.wascik-rep-min span{font-size:12px;font-weight:800;text-align:left}.wascik-rep-min small{display:block;color:#92a8bd;font-weight:500}.wascik-rep-min b{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#2d78ff,#09b7ca)}
        @media (max-width:600px){
          .wascik-rep{bottom:calc(82px + env(safe-area-inset-bottom));right:8px!important;left:auto!important;width:calc(100vw - 16px)}
          .wascik-rep-stage{grid-template-columns:minmax(0,1fr) 72px;gap:6px}
          .wascik-rep-bubble{margin-bottom:28px;border-radius:20px}
          .wascik-rep-bubble:after{right:-8px;bottom:28px;width:16px;height:16px}
          .wascik-rep-head{padding:10px 11px 8px}.wascik-rep-head strong{font-size:12px}.wascik-rep-head span{font-size:9px}
          .wascik-rep-scroll{max-height:30vh;padding:0 11px 9px}.wascik-rep-reply{padding:11px;font-size:12px}
          .wascik-rep-form{padding:8px;gap:6px}.wascik-rep-form input{padding:9px 10px;font-size:12px}.wascik-rep-form button{width:36px;height:36px}
          .wascik-rep-person{height:188px;justify-content:flex-end}.wascik-rep-avatar{transform:scale(.68);transform-origin:bottom right}.wascik-rep-shadow{width:60px;right:2px}
        }
      `}</style>
    </aside>
  );
}
