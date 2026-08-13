import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AquaCurve Product Guide",
  description: "Explore AquaCurve products and current merchant information through WASCIK Affiliate Services, with clearly disclosed affiliate shopping links.",
  alternates: {
    canonical: "/affiliate-services/aquacurve",
  },
  openGraph: {
    type: "article",
    url: "/affiliate-services/aquacurve",
    title: "AquaCurve Product Guide | WASCIK Affiliate Services",
    description: "Explore AquaCurve products and current merchant information through WASCIK Affiliate Services, with clearly disclosed affiliate shopping links.",
  },
  twitter: {
    card: "summary",
    title: "AquaCurve Product Guide | WASCIK Affiliate Services",
    description: "Explore AquaCurve products and current merchant information through WASCIK Affiliate Services, with clearly disclosed affiliate shopping links.",
  },
};

export default function AffiliateGuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
