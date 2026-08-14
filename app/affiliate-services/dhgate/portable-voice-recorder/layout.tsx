import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portable Voice Recorder Guide",
  description: "Review the portable card-size voice recorder's features, use cases, storage support, and buying information through WASCIK Affiliate Services.",
  alternates: {
    canonical: "/affiliate-services/dhgate/portable-voice-recorder",
  },
  openGraph: {
    type: "article",
    url: "/affiliate-services/dhgate/portable-voice-recorder",
    title: "Portable Voice Recorder Guide | WASCIK Affiliate Services",
    description: "Review the portable card-size voice recorder's features, use cases, storage support, and buying information through WASCIK Affiliate Services.",
  },
  twitter: {
    card: "summary",
    title: "Portable Voice Recorder Guide | WASCIK Affiliate Services",
    description: "Review the portable card-size voice recorder's features, use cases, storage support, and buying information through WASCIK Affiliate Services.",
  },
};

export default function AffiliateGuideLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
