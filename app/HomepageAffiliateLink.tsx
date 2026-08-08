"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HomepageAffiliateLink() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <Link
      href="/affiliate-services"
      aria-label="Open WASCIK Affiliate Services"
      style={{
        position: "fixed",
        right: "18px",
        bottom: "18px",
        zIndex: 50,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "48px",
        padding: "12px 18px",
        border: "1px solid rgba(71, 211, 255, 0.8)",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #062b43, #075b82)",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: 800,
        textDecoration: "none",
        boxShadow: "0 0 24px rgba(0, 174, 239, 0.38)",
      }}
    >
      Affiliate Services →
    </Link>
  );
}
