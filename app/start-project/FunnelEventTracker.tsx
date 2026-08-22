"use client";

import { useEffect } from "react";

const SESSION_KEY = "wascik-funnel-session-v1";
const CONTACT_VIEW_KEY = "wascik-funnel-contact-view-v1";

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function campaignData() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") || params.get("source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
    };
  } catch {
    return { source: "", medium: "", campaign: "" };
  }
}

function sendEvent(event: string) {
  const campaign = campaignData();
  void fetch("/api/funnel-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      path: window.location.pathname,
      sessionId: getSessionId(),
      ...campaign,
    }),
    keepalive: true,
  }).catch(() => {});
}

function classifyClick(link: HTMLAnchorElement) {
  const text = (link.textContent || "").trim().toLowerCase();
  const href = link.getAttribute("href") || "";

  if (text.includes("claim the $324")) return "claim_324_click";
  if (text.includes("ask michael")) return "ask_michael_click";
  if (text.includes("website example") || text.includes("website demo")) return "demo_click";
  if (href.startsWith("tel:+15015782259") || text.includes("call michael") || text.includes("call (501)")) return "call_click";
  return "";
}

export default function FunnelEventTracker() {
  useEffect(() => {
    sendEvent("funnel_view");

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a");
      if (!(link instanceof HTMLAnchorElement)) return;
      const funnelEvent = classifyClick(link);
      if (funnelEvent) sendEvent(funnelEvent);
    };

    document.addEventListener("click", onClick, true);

    const contact = document.getElementById("contact");
    let observer: IntersectionObserver | null = null;
    if (contact && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          try {
            if (sessionStorage.getItem(CONTACT_VIEW_KEY) === "1") return;
            sessionStorage.setItem(CONTACT_VIEW_KEY, "1");
          } catch {}
          sendEvent("final_cta_view");
          observer?.disconnect();
        },
        { threshold: 0.35 },
      );
      observer.observe(contact);
    }

    return () => {
      document.removeEventListener("click", onClick, true);
      observer?.disconnect();
    };
  }, []);

  return null;
}
