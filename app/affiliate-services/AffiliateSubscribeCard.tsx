"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const brandLabels: Record<string, string> = {
  "/affiliate-services": "WASCIK Affiliate Services",
  "/affiliate-services/aquacurve": "AquaCurve",
  "/affiliate-services/coofandy": "COOFANDY",
  "/affiliate-services/dhgate": "DHgate",
  "/affiliate-services/eurooptic": "EuroOptic",
  "/affiliate-services/focus-camera": "Focus Camera",
  "/affiliate-services/gearup": "GearUP Gaming",
  "/affiliate-services/ticketnetwork": "TicketNetwork",
};

type SubscriptionSource = {
  key: string;
  label: string;
  type: "brand_page" | "generated_ad" | "affiliate_services";
  productId?: string;
  adPlatform?: string;
};

function sourceForPath(pathname: string): SubscriptionSource {
  const exact = brandLabels[pathname];
  if (exact) return { key: pathname.replace(/^\/affiliate-services\/?/, "") || "all-affiliate-services", label: exact, type: pathname === "/affiliate-services" ? "affiliate_services" : "brand_page" };
  const matching = Object.entries(brandLabels)
    .filter(([path]) => path !== "/affiliate-services" && pathname.startsWith(`${path}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  if (matching) return { key: matching[0].replace("/affiliate-services/", ""), label: matching[1], type: "brand_page" };
  return { key: "all-affiliate-services", label: "WASCIK Affiliate Services", type: "affiliate_services" };
}

export default function AffiliateSubscribeCard() {
  const pathname = usePathname();
  const pageSource = useMemo(() => sourceForPath(pathname), [pathname]);
  const [attributedSource, setAttributedSource] = useState<SubscriptionSource | null>(null);
  const source = attributedSource || pageSource;
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("wascik_subscribe") !== "ad") {
      setAttributedSource(null);
      return;
    }
    const key = (params.get("source_key") || "").trim().slice(0, 240);
    if (!key) return;
    const productId = (params.get("product_id") || "").trim().slice(0, 240);
    const adPlatform = (params.get("platform") || "").trim().slice(0, 80);
    setAttributedSource({
      type: "generated_ad",
      key,
      label: `${pageSource.label}${adPlatform ? ` · ${adPlatform} ad` : " · generated ad"}`,
      ...(productId ? { productId } : {}),
      ...(adPlatform ? { adPlatform } : {}),
    });
  }, [pageSource]);

  async function subscribe(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/affiliate-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website,
          sourceType: source.type,
          sourceKey: source.key,
          sourceLabel: source.label,
          sourcePath: pathname,
          productId: source.productId || "",
          adPlatform: source.adPlatform || "",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not subscribe right now.");
      setMessage(data.message || "You’re subscribed.");
      setEmail("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not subscribe right now.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="relative z-10 border-t border-sky-900/70 bg-[#03111d] px-5 py-12 md:px-8">
    <div className="mx-auto max-w-4xl rounded-3xl border border-sky-700/60 bg-[linear-gradient(135deg,rgba(4,32,50,.96),rgba(3,13,23,.98))] p-6 shadow-[0_20px_60px_rgba(0,0,0,.28)] sm:p-8">
      <p className="text-xs font-black uppercase tracking-[.24em] text-sky-300">Email updates · {source.label}</p>
      <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Get future products, deals, and updates that match what you’re interested in.</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">Subscribe and WASCIK will remember which affiliate brand or ad brought you here so future promotional emails can be better matched to your interests.</p>
      <form onSubmit={subscribe} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="sr-only" htmlFor="affiliate-subscribe-email">Email address</label>
        <input id="affiliate-subscribe-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" className="min-h-12 rounded-xl border border-sky-700/70 bg-[#020913] px-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-sky-400" />
        <input tabIndex={-1} aria-hidden="true" autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} className="hidden" />
        <button type="submit" disabled={loading} className="min-h-12 rounded-xl bg-yellow-300 px-6 font-black text-slate-950 transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Subscribing…" : "Subscribe"}</button>
      </form>
      <p className="mt-3 text-xs leading-5 text-slate-500">By subscribing, you agree to receive future WASCIK Affiliate Services promotional emails. You can unsubscribe later.</p>
      {message ? <p className="mt-3 font-bold text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 font-bold text-red-300">{error}</p> : null}
    </div>
  </section>;
}
