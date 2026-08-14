import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./tech-background.css";
import "./code-atmosphere.css";
import HomepageAffiliateLink from "./HomepageAffiliateLink";

const siteUrl = "https://wascik-app-development.netlify.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WASCIK App Development | Websites, Apps & AI Solutions",
    template: "%s | WASCIK App Development",
  },
  description:
    "WASCIK App Development builds mobile-friendly websites, apps, e-commerce experiences, branding, and practical AI solutions for small businesses in Central Arkansas and beyond.",
  alternates: {
    canonical: "/",
  },
  applicationName: "WASCIK App Development",
  authors: [{ name: "Michael Lewis" }],
  creator: "WASCIK App Development",
  publisher: "WASCIK App Development",
  category: "Technology",
  keywords: [
    "WASCIK App Development",
    "website development Little Rock",
    "small business website Arkansas",
    "mobile app development",
    "AI solutions for business",
    "e-commerce website development",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "WASCIK App Development",
    title: "WASCIK App Development | Websites, Apps & AI Solutions",
    description:
      "Mobile-friendly websites, apps, e-commerce, branding, and practical AI solutions built around your business.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "WASCIK App Development | Websites, Apps & AI Solutions",
    description:
      "Mobile-friendly websites, apps, e-commerce, branding, and practical AI solutions built around your business.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${siteUrl}/#organization`,
  name: "WASCIK App Development",
  url: siteUrl,
  founder: {
    "@type": "Person",
    name: "Michael Lewis",
  },
  telephone: "+1-501-578-2259",
  email: "LewisMike0435@gmail.com",
  areaServed: [
    {
      "@type": "AdministrativeArea",
      name: "Central Arkansas",
    },
    {
      "@type": "Country",
      name: "United States",
    },
  ],
  description:
    "WASCIK App Development creates websites, mobile applications, e-commerce experiences, branding, and practical AI solutions for businesses.",
  knowsAbout: [
    "Website development",
    "Mobile application development",
    "Artificial intelligence solutions",
    "E-commerce",
    "Digital branding",
    "Website maintenance",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "WASCIK App Development",
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
  inLanguage: "en-US",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
      </head>
      <body className="min-h-full">
        {children}
        <HomepageAffiliateLink />
      </body>
    </html>
  );
}
