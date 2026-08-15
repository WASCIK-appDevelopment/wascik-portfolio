"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "wascik-affiliate-session-v1";

const merchantNames = [
  "TicketNetwork",
  "EuroOptic",
  "Focus Camera",
  "Lifestyle by Focus",
  "AquaCurve",
  "GearUP",
  "DHgate",
  "Philips",
  "RevoMatic",
  "ArcCaptain",
];

function getSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return "";
  }
}

function merchantFromPath(pathname: string) {
  if (pathname.includes("/ticketnetwork")) return "TicketNetwork";
  if (pathname.includes("/eurooptic")) return "EuroOptic";
  if (pathname.includes("/focus-camera")) return "Focus Camera";
  if (pathname.includes("/aquacurve")) return "AquaCurve";
  if (pathname.includes("/gearup")) return "GearUP";
  if (pathname.includes("/dhgate")) return "DHgate";
  return "";
}

function merchantFromContext(anchor: HTMLAnchorElement, pathname: string, host: string) {
  const fromPath = merchantFromPath(pathname);
  if (fromPath) return fromPath;

  const container = anchor.closest("article,section,li,div");
  const context = `${anchor.textContent || ""} ${container?.textContent || ""}`.slice(0, 1200).toLowerCase();
  for (const name of merchantNames) {
    if (context.includes(name.toLowerCase())) return name;
  }

  const hostname = host.toLowerCase();
  if (hostname.includes("ticketnetwork")) return "TicketNetwork";
  if (hostname.includes("eurooptic")) return "EuroOptic";
  if (hostname.includes("focuscamera")) return "Focus Camera";
  if (hostname.includes("aquacurve")) return "AquaCurve";
  if (hostname.includes("gearup")) return "GearUP";
  if (hostname.includes("dhgate")) return "DHgate";
  if (hostname.includes("philips")) return "Philips";
  return "Affiliate Merchant";
}

function itemLabel(anchor: HTMLAnchorElement) {
  const direct = (anchor.textContent || "").replace(/\s+/g, " ").trim();
  const container = anchor.closest("article,section,li,div");
  const heading = container?.querySelector("h1,h2,h3,h4")?.textContent?.replace(/\s+/g, " ").trim() || "";
  if (heading && direct && !direct.toLowerCase().includes(heading.toLowerCase())) return `${heading} — ${direct}`.slice(0, 240);
  return (heading || direct || "Affiliate link").slice(0, 240);
}

export default function AffiliateClickAutoTracker() {
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!pathname.startsWith("/affiliate-services")) return;

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.dataset.wascikTracked === "true") return;

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (!/^https?:$/.test(destination.protocol) || destination.origin === window.location.origin) return;
      const rel = (anchor.getAttribute("rel") || "").toLowerCase();
      const opensExternal = anchor.target === "_blank" || rel.includes("sponsored") || rel.includes("nofollow");
      if (!opensExternal) return;

      const payload = JSON.stringify({
        destinationUrl: destination.toString(),
        merchant: merchantFromContext(anchor, pathname, destination.hostname),
        itemLabel: itemLabel(anchor),
        sourcePath: pathname,
        sessionId: getSessionId(),
      });

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/affiliate-click", new Blob([payload], { type: "application/json" }));
        } else {
          void fetch("/api/affiliate-click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          });
        }
      } catch {
        // Analytics must never interfere with the merchant destination.
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  return null;
}
