import type { Metadata } from "next";
import FunnelEventTracker from "./FunnelEventTracker";

export const metadata: Metadata = {
  title: "Affordable Small-Business Website Development in Little Rock",
  description:
    "Mobile-friendly website development for small businesses in Little Rock, Central Arkansas, and beyond, with clear promotional pricing and direct support from WASCIK founder Michael Lewis.",
  alternates: {
    canonical: "/start-project",
  },
  openGraph: {
    type: "website",
    url: "/start-project",
    title: "Affordable Small-Business Website Development | WASCIK",
    description:
      "Explore WASCIK's mobile-friendly website services, $324 promotional package, transparent ongoing costs, and direct founder support.",
  },
  twitter: {
    card: "summary",
    title: "Affordable Small-Business Website Development | WASCIK",
    description:
      "Mobile-friendly websites, transparent promotional pricing, and direct support for Central Arkansas small businesses.",
  },
};

export default function StartProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FunnelEventTracker />
      {children}
    </>
  );
}
