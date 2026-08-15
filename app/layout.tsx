import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./tech-background.css";
import "./code-atmosphere.css";
import "./representative-mobile.css";
import HomepageAffiliateLink from "./HomepageAffiliateLink";
import PortfolioVisitTracker from "./PortfolioVisitTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WASCIK App Development",
    template: "%s | WASCIK App Development",
  },
  description:
    "Professional websites for local businesses, designed and developed by WASCIK App Development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <meta
          name="impact-site-verification"
          content="b92be5b8-e61a-476b-a19c-8ff91bfc0e95"
        />
      </head>
      <body className="min-h-full">
        <PortfolioVisitTracker />
        {children}
        <HomepageAffiliateLink />
      </body>
    </html>
  );
}
