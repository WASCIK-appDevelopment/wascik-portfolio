import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Focus Camera Product Guide",
  description: "Explore featured cameras, electronics, and lifestyle technology available through Focus Camera, with clearly disclosed affiliate shopping links.",
  alternates: {
    canonical: "/affiliate-services/focus-camera",
  },
  openGraph: {
    type: "article",
    url: "/affiliate-services/focus-camera",
    title: "Focus Camera Product Guide | WASCIK Affiliate Services",
    description: "Explore featured cameras, electronics, and lifestyle technology available through Focus Camera, with clearly disclosed affiliate shopping links.",
  },
  twitter: {
    card: "summary",
    title: "Focus Camera Product Guide | WASCIK Affiliate Services",
    description: "Explore featured cameras, electronics, and lifestyle technology available through Focus Camera, with clearly disclosed affiliate shopping links.",
  },
};

export default function AffiliateGuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
