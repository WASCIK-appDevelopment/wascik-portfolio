import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EuroOptic Product Guide",
  description: "Explore featured outdoor, optics, and technology products available through EuroOptic, with clearly disclosed affiliate shopping links.",
  alternates: {
    canonical: "/affiliate-services/eurooptic",
  },
  openGraph: {
    type: "article",
    url: "/affiliate-services/eurooptic",
    title: "EuroOptic Product Guide | WASCIK Affiliate Services",
    description: "Explore featured outdoor, optics, and technology products available through EuroOptic, with clearly disclosed affiliate shopping links.",
  },
  twitter: {
    card: "summary",
    title: "EuroOptic Product Guide | WASCIK Affiliate Services",
    description: "Explore featured outdoor, optics, and technology products available through EuroOptic, with clearly disclosed affiliate shopping links.",
  },
};

export default function AffiliateGuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
