import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Summit Home Services Demo Website",
  description:
    "A fictional small-business website demonstration created by WASCIK App Development.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SampleProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
