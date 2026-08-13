import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliate Services | Technology & Product Guides",
  description:
    "Explore research-backed technology, smart-home, wellness, gaming, welding, and lifestyle product guides from WASCIK Affiliate Services.",
  alternates: {
    canonical: "/affiliate-services",
  },
  openGraph: {
    type: "website",
    url: "/affiliate-services",
    title: "WASCIK Affiliate Services | Technology & Product Guides",
    description:
      "Research-backed product selections, useful features, buying information, and clearly disclosed affiliate links.",
  },
  twitter: {
    card: "summary",
    title: "WASCIK Affiliate Services | Technology & Product Guides",
    description:
      "Research-backed product selections, useful features, buying information, and clearly disclosed affiliate links.",
  },
};

export default function AffiliateServicesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
