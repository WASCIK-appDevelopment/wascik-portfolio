"use client";

import { usePathname } from "next/navigation";
import RepresentativeWidget from "./ai-funnel/RepresentativeWidget";

const EXCLUDED_PREFIXES = [
  "/owner",
  "/owner-ai-studio",
  "/api",
  "/ai-funnel/widget-preview",
  "/ai-funnel/live",
  "/ai-funnel/shopper",
];

export default function SitewideRepresentative() {
  const pathname = usePathname() || "/";

  if (EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return null;
  }

  return (
    <RepresentativeWidget
      title="WASCIK Digital Representative"
      greeting="Hi. I’m the WASCIK digital representative. What can I help you with today?"
      position="right"
      defaultOpen={false}
    />
  );
}
