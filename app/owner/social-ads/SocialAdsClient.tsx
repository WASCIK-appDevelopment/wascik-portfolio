"use client";

import { useEffect, useMemo, useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";

type DraftResult = {
  primaryCopy?: string;
  headline?: string;
  cta?: string;
  hashtags?: string[];
  complianceNotes?: string[];
};

type CatalogProduct = {
  id: string;
  merchant: string;
  title: string;
  category?: string | null;
  description?: string | null;
  features?: string[] | null;
  affiliate_url?: string | null;
  image_url?: string | null;
  price?: string | null;
  page_path?: string | null;
  published_at?: string | null;
};

const platforms = ["Facebook", "Instagram", "TikTok", "Threads", "X", "YouTube", "General social post"];

export default function SocialAdsClient() {
  const [platform, setPlatform] = useState("");
  const [platformPickerOpen, setPlatformPickerOpen] = useState(false);
  const [objective, setObjective] = useState("Drive product interest and affiliate clicks");
  const [creativeNotes, setCreativeNotes] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const response = await fetch("/api/owner/affiliate-search/approved", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load your affiliate products.");
        const published = (Array.isArray(data.products) ? data.products as CatalogProduct[] : [])
          .filter((item) => Boolean(item.published_at))
          .sort((a, b) => `${a.merchant} ${a.title}`.localeCompare(`${b.merchant} ${b.title}`));
        setProducts(published);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load your affiliate products.");
      } finally {
        setCatalogLoading(false);
      }
    }
    void loadCatalog();
  }, []);

  const selectedProduct = useMemo(() => products.find((item) => item.id === selectedId) || null, [products, selectedId]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((item) => [item.merchant, item.title, item.category || ""].some((value) => value.toLowerCase().includes(query)));
  }, [products, search]);
  const canGenerate = Boolean(platform && selectedProduct && !loading);

  function selectProduct(item: CatalogProduct) {
    setSelectedId(item.id);
    setPlatform("");
    setResult(null);
    setNotice("");
    setError("");
    setPlatformPickerOpen(true);
  }

  function choosePlatform(value: string) {
    setPlatform(value);
    setPlatformPickerOpen(false);
    setResult(null);
    setNotice("");
  }

  function verifiedFacts(item: CatalogProduct) {
    return [
      item.category ? `Category: ${item.category}` : "",
      item.description ? `Description: ${item.description}` : "",
      item.features?.length ? `Features: ${item.features.join("; ")}` : "",
      item.price ? `Stored price: ${item.price}` : "",
      item.page_path ? `Published WASCIK page: ${item.page_path}` : "",
      creativeNotes.trim() ? `Owner creative direction: ${creativeNotes.trim()}` : "",
    ].filter(Boolean).join("\n");
  }

  async function generate() {
    if (!canGenerate || !selectedProduct) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);
    try {
      const response = await fetch("/api/owner/social-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ platform, merchant: selectedProduct.merchant, product: selectedProduct.title, affiliateUrl: selectedProduct.affiliate_url || "", objective, notes: verifiedFacts(selectedProduct) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate content.");
      setResult(data as DraftResult);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate content.");
    } finally {
      setLoading(false);
    }
  }

  function adPackageText() {
    if (!result || !selectedProduct) return "";
    return [
      "WASCIK ADS",
      `Platform: ${platform}`,
      `Brand: ${selectedProduct.merchant}`,
      `Product: ${selectedProduct.title}`,
      selectedProduct.affiliate_url ? `Affiliate link: ${selectedProduct.affiliate_url}` : "",
      result.headline ? `HEADLINE\n${result.headline}` : "",
      result.primaryCopy ? `AD COPY\n${result.primaryCopy}` : "",
      result.cta ? `CTA\n${result.cta}` : "",
      result.hashtags?.length ? `HASHTAGS\n${result.hashtags.join(" ")}` : "",
      result.complianceNotes?.length ? `COMPLIANCE NOTES\n- ${result.complianceNotes.join("\n- ")}` : "",
    ].filter(Boolean).join("\n\n");
  }

  function downloadAd() {
    if (!result || !selectedProduct) return;
    const blob = new Blob([adPackageText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const safeName = `${selectedProduct.merchant}-${selectedProduct.title}-${platform}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 90);
    anchor.href = url;
    anchor.download = `${safeName || "WASCIK-Ad"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice("Ad package downloaded to your device.");
  }

  async function emailAd() {
    if (!result || !selectedProduct || emailing) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setEmailing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/owner/social-ads/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({
          merchant: selectedProduct.merchant,
          product: selectedProduct.title,
          platform,
          affiliateUrl: selectedProduct.affiliate_url || "",
          headline: result.headline || "",
          primaryCopy: result.primaryCopy || "",
          cta: result.cta || "",
          hashtags: result.hashtags || [],
          complianceNotes: result.complianceNotes || [],
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The ad could not be emailed.");
      setNotice(data.message || "Ad emailed from WASCIK Ads.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The ad could not be emailed.");
    } finally {
      setEmailing(false);
    }
  }

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  const fieldStyle = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 16 } as const;
  const labelStyle = { display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 } as const;
  const actionButton = { border: "1px solid rgba(113,220,255,.35)", borderRadius: 11, background: "rgba(113,220,255,.08)", color: "#71dcff", padding: "10px 12px", fontWeight: 850, cursor: "pointer" } as const;

  return <div style={{ display: "grid", gap: 16 }}>
    <section style={{ border: "1px solid rgba(113,220,255,.18)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div><h2 style={{ margin: 0 }}>Pick a published product</h2><p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.55 }}>Choose a product already published in WASCIK Affiliate Services. Its stored affiliate information is loaded automatically.</p></div>
        <label style={labelStyle}>Find a product<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, brand, or category" style={fieldStyle} /></label>
        {catalogLoading ? <div style={{ color: "#71dcff" }}>Loading your published affiliate catalog…</div> : null}
        {!catalogLoading && filteredProducts.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, maxHeight: 430, overflowY: "auto" }}>
          {filteredProducts.map((item) => <button key={item.id} type="button" onClick={() => selectProduct(item)} style={{ textAlign: "left", border: item.id === selectedId ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.11)", borderRadius: 14, padding: 10, background: item.id === selectedId ? "rgba(113,220,255,.10)" : "rgba(255,255,255,.03)", color: "#eef8ff", cursor: "pointer" }}>
            {item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 10, background: "rgba(255,255,255,.04)", marginBottom: 9 }} /> : null}
            <div style={{ color: "#71dcff", fontSize: 12, fontWeight: 800 }}>{item.merchant}</div><div style={{ marginTop: 4, fontWeight: 800 }}>{item.title}</div>{item.category ? <div style={{ marginTop: 5, color: "#9fb5c5", fontSize: 12 }}>{item.category}</div> : null}
          </button>)}
        </div> : null}
      </div>
    </section>

    <section style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Create the ad</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <div style={labelStyle}>Platform<button type="button" disabled={!selectedProduct} onClick={() => setPlatformPickerOpen(true)} style={{ ...fieldStyle, textAlign: "left", cursor: selectedProduct ? "pointer" : "not-allowed" }}>{platform || (selectedProduct ? "Choose platform" : "Pick a product first")}</button></div>
          <label style={labelStyle}>Goal<input value={objective} onChange={(event) => setObjective(event.target.value)} style={fieldStyle} /></label>
        </div>
        <label style={labelStyle}>Optional direction<textarea value={creativeNotes} onChange={(event) => setCreativeNotes(event.target.value)} rows={3} placeholder="Optional: emphasize a feature, say LINK IN BIO, make it energetic, etc." style={{ ...fieldStyle, resize: "vertical" }} /></label>
        <button type="button" disabled={!canGenerate} onClick={generate} style={{ border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 900, cursor: canGenerate ? "pointer" : "not-allowed", background: canGenerate ? "#71dcff" : "#314653", color: "#031019", fontSize: 16 }}>{loading ? "AI is building your ad…" : !selectedProduct ? "Pick a product first" : !platform ? "Choose a platform" : `Generate ${platform} Ad`}</button>
        {error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}{notice ? <div style={{ color: "#8ff0b8", fontSize: 13 }}>{notice}</div> : null}
      </div>
    </section>

    {result && selectedProduct ? <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        <button type="button" onClick={downloadAd} style={actionButton}>Download Ad to Phone</button>
        <button type="button" disabled={emailing} onClick={() => void emailAd()} style={{ ...actionButton, opacity: emailing ? .6 : 1 }}>{emailing ? "Emailing…" : "Email Ad"}</button>
      </div>
      <div style={{ color: "#91a8b7", fontSize: 12, lineHeight: 1.5 }}>For now, Download saves the complete written ad package as a file. When visual/image or video ad generation is added, this same button can download that finished creative instead.</div>
      {[{ label: "Primary copy", value: result.primaryCopy }, { label: "Headline", value: result.headline }, { label: "CTA", value: result.cta }].filter((item) => item.value).map((item) => <div key={item.label} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>{item.label}</strong><button type="button" onClick={() => void copyText(item.value || "")} style={{ ...actionButton, padding: "6px 10px" }}>Copy</button></div><div style={{ marginTop: 9, whiteSpace: "pre-wrap", color: "#dbe9f1", lineHeight: 1.6 }}>{item.value}</div></div>)}
      {result.hashtags?.length ? <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><strong>Hashtags</strong><div style={{ marginTop: 8, color: "#71dcff" }}>{result.hashtags.join(" ")}</div></div> : null}
      {result.complianceNotes?.length ? <div style={{ border: "1px solid rgba(255,205,92,.25)", borderRadius: 14, padding: 14, background: "rgba(255,205,92,.05)" }}><strong style={{ color: "#ffd76f" }}>Compliance check</strong><ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>{result.complianceNotes.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    </section> : null}

    {platformPickerOpen && selectedProduct ? <div role="dialog" aria-modal="true" aria-label="Choose social platform" onClick={() => setPlatformPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 18, background: "rgba(0,0,0,.72)" }}><div onClick={(event) => event.stopPropagation()} style={{ width: "min(520px,100%)", border: "1px solid rgba(113,220,255,.32)", borderRadius: 20, padding: 18, background: "#07131d" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: "#71dcff", fontSize: 12, fontWeight: 900 }}>WHERE DO YOU WANT THIS AD?</div><h2 style={{ margin: "5px 0 0" }}>Choose a platform</h2><div style={{ marginTop: 6, color: "#9fb5c5", fontSize: 13 }}>{selectedProduct.merchant} — {selectedProduct.title}</div></div><button type="button" onClick={() => setPlatformPickerOpen(false)} style={{ ...actionButton, height: 36 }}>✕</button></div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 16 }}>{platforms.map((item) => <button key={item} type="button" onClick={() => choosePlatform(item)} style={{ border: platform === item ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.13)", borderRadius: 14, padding: "14px 10px", background: platform === item ? "rgba(113,220,255,.12)" : "rgba(255,255,255,.035)", color: "#eef8ff", fontWeight: 850, cursor: "pointer" }}>{item}</button>)}</div></div></div> : null}
  </div>;
}
