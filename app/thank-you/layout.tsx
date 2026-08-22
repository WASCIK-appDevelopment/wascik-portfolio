import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You | WASCIK",
  description:
    "Thank you for choosing WASCIK for your website design and development project.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
