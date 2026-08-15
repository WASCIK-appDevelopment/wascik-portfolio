"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomepageAffiliateLink() {
  const pathname = usePathname();
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;

    const updateVisibility = () => {
      const portrait = document.querySelector<HTMLElement>(".wascik-portrait-wrap");
      if (!portrait) {
        setShowLink(false);
        return;
      }

      const portraitBottom = portrait.getBoundingClientRect().bottom + window.scrollY;
      setShowLink(window.scrollY > portraitBottom);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [pathname]);

  if (pathname !== "/" || !showLink) return null;

  return (
    <Link
      href="/affiliate-services"
      aria-label="Open WASCIK Affiliate Services"
      style={{
        position: "fixed",
        right: "10px",
        bottom: "12px",
        zIndex: 50,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "42px",
        padding: "9px 12px",
        border: "1px solid rgba(71, 211, 255, 0.8)",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #062b43, #075b82)",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: 800,
        textDecoration: "none",
        boxShadow: "0 0 24px rgba(0, 174, 239, 0.38)",
      }}
    >
      Affiliate Services →
    </Link>
  );
}
