import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GearUP Gaming Guide",
  description: "Explore GearUP mobile gaming connection tools, key benefits, setup information, and a clearly disclosed affiliate shopping link.",
  alternates: {
    canonical: "/affiliate-services/gearup",
  },
  openGraph: {
    type: "article",
    url: "/affiliate-services/gearup",
    title: "GearUP Gaming Guide | WASCIK Affiliate Services",
    description: "Explore GearUP mobile gaming connection tools, key benefits, setup information, and a clearly disclosed affiliate shopping link.",
  },
  twitter: {
    card: "summary",
    title: "GearUP Gaming Guide | WASCIK Affiliate Services",
    description: "Explore GearUP mobile gaming connection tools, key benefits, setup information, and a clearly disclosed affiliate shopping link.",
  },
};

export default function AffiliateGuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
