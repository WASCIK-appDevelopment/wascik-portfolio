"use client";

import { useEffect } from "react";

const SESSION_KEY = "wascik-visitor-session-v1";
const PAGE_MARKER = "wascik-portfolio-visit-recorded-v1";

function sessionId() {
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

export default function SiteVisitTracker({ path = "/" }: { path?: string }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(PAGE_MARKER) === "1") return;
      sessionStorage.setItem(PAGE_MARKER, "1");
    } catch {}

    void fetch("/api/site-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, sessionId: sessionId() }),
      keepalive: true,
    }).catch(() => {});
  }, [path]);

  return null;
}
