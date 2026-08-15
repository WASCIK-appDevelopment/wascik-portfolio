"use client";

import { usePathname } from "next/navigation";
import SiteVisitTracker from "./SiteVisitTracker";

export default function PortfolioVisitTracker() {
  const pathname = usePathname();
  return pathname === "/" ? <SiteVisitTracker path="/" /> : null;
}
