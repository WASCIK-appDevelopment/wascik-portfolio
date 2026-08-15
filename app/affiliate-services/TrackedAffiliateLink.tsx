"use client";

import { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  merchant: string;
  itemLabel?: string;
  children: ReactNode;
};

const SESSION_KEY = "wascik-affiliate-session-v1";

function sessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return "";
  }
}

export default function TrackedAffiliateLink({ href, merchant, itemLabel, children, onClick, ...rest }: Props) {
  const pathname = usePathname() || "/";

  function track(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const payload = JSON.stringify({ destinationUrl: href, merchant, itemLabel, sourcePath: pathname, sessionId: sessionId() });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/affiliate-click", new Blob([payload], { type: "application/json" }));
      } else {
        void fetch("/api/affiliate-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
      }
    } catch {
      // Analytics must never block the affiliate destination.
    }
  }

  return <a href={href} onClick={track} data-wascik-tracked="true" {...rest}>{children}</a>;
}
