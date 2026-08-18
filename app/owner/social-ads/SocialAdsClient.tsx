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
  catalog_source?: "builtin" | "console";
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
  const [error, setError] = useState("");

  useEffect(() => {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    async function loadCatalog() {
      setCatalogLoading(true);
      setError("");
      try {
        const response = await fetch("/api/owner/affiliate-search/approved", {
          headers: { "x-wascik-owner-key": key },
          cache: "no-store",
        });
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
    return products.filter((item) => [item.merchant, item.title, item.category || ""]
      .some((value) => value.toLowerCase().includes(query)));
  }, [products, search]);

  const canGenerate = Boolean(platform && selectedProduct && !loading);

  function selectProduct(item: CatalogProduct) {
    setSelectedId(item.id);
    setPlatform("");
    setResult(null);
    setError("");
    setPlatformPickerOpen(true);
  }

  function choosePlatform(value: string) {
    setPlatform(value);
    setPlatformPickerOpen(false);
    setResult(null);
  }

  function verifiedFacts(item: CatalogProduct) {
    const facts = [
      item.category ? `Category: ${item.category}` : "",
      item.description ? `Description: ${item.description}` : "",
      item.features?.length ? `Features: ${item.features.join("; ")}` : "",
      item.price ? `Stored price: ${item.price}` : "",
      item.page_path ? `Published WASCIK page: ${item.page_path}` : "",
      creativeNotes.trim() ? `Owner creative direction: ${creativeNotes.trim()}` : "",
    ].filter(Boolean);
    return facts.join("\n");
  }

  async function generate() {
    if (!canGenerate || !selectedProduct) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/owner/social-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({
          platform,
          merchant: selectedProduct.merchant,
          product: selectedProduct.title,
          affiliateUrl: selectedProduct.affiliate_url || "",
          objective,
          notes: verifiedFacts(selectedProduct),
        }),
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

  async function copyText(text: string) {
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  const fieldStyle = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 16 } as const;
  const labelStyle = { display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 } as const;

  return <div style={{ display: "grid", gap: 16 }}>
    <section style={{ border: "1px solid rgba(113,220,255,.18)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Pick a published product</h2>
          <p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.55 }}>Choose from products already on WASCIK Affiliate Services. The console automatically supplies the stored brand, product name, affiliate link, description, features, price when available, and published page to the AI.</p>
        </div>

        <label style={labelStyle}>Find a product
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, brand, or category" style={fieldStyle} />
        </label>

        {catalogLoading ? <div style={{ color: "#71dcff" }}>Loading your published affiliate catalog…</div> : null}
        {!catalogLoading && !products.length ? <div style={{ color: "#ffcf70" }}>No published affiliate products were found.</div> : null}

        {!catalogLoading && filteredProducts.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, maxHeight: 430, overflowY: "auto", paddingRight: 2 }}>
          {filteredProducts.map((item) => {
            const selected = item.id === selectedId;
            return <button key={item.id} type="button" onClick={() => selectProduct(item)} style={{ textAlign: "left", border: selected ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.11)", borderRadius: 14, padding: 10, background: selected ? "rgba(113,220,255,.10)" : "rgba(255,255,255,.03)", color: "#eef8ff", cursor: "pointer" }}>
              {item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 10, background: "rgba(255,255,255,.04)", marginBottom: 9 }} /> : null}
              <div style={{ color: "#71dcff", fontSize: 12, fontWeight: 800 }}>{item.merchant}</div>
              <div style={{ marginTop: 4, fontWeight: 800, lineHeight: 1.35 }}>{item.title}</div>
              {item.category ? <div style={{ marginTop: 5, color: "#9fb5c5", fontSize: 12 }}>{item.category}</div> : null}
              <div style={{ marginTop: 8, color: selected ? "#71dcff" : "#879cab", fontSize: 11, fontWeight: 800 }}>{selected ? "SELECTED" : "TAP TO SELECT"}</div>
            </button>;
          })}
        </div> : null}

        {selectedProduct ? <div style={{ border: "1px solid rgba(113,220,255,.28)", borderRadius: 14, padding: 13, background: "rgba(113,220,255,.06)" }}>
          <strong style={{ color: "#71dcff" }}>Selected: {selectedProduct.merchant}</strong>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{selectedProduct.title}</div>
          <div style={{ marginTop: 7, color: "#a9bdcc", fontSize: 12 }}>Affiliate link and stored product information will be inserted automatically.</div>
        </div> : null}
      </div>
    </section>

    <section style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Create the ad copy</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <div style={labelStyle}>Platform
            <button type="button" disabled={!selectedProduct} onClick={() => setPlatformPickerOpen(true)} style={{ ...fieldStyle, textAlign: "left", cursor: selectedProduct ? "pointer" : "not-allowed" }}>
              {platform || (selectedProduct ? "Choose platform" : "Pick a product first")}
            </button>
          </div>
          <label style={labelStyle}>Goal
            <input value={objective} onChange={(event) => setObjective(event.target.value)} style={fieldStyle} />
          </label>
        </div>
        <label style={labelStyle}>Optional direction for this ad
          <textarea value={creativeNotes} onChange={(event) => setCreativeNotes(event.target.value)} rows={3} placeholder="Optional: emphasize a feature, say LINK IN BIO, make it energetic, etc." style={{ ...fieldStyle, resize: "vertical" }} />
        </label>
        <button type="button" disabled={!canGenerate} onClick={generate} style={{ border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 900, cursor: canGenerate ? "pointer" : "not-allowed", background: canGenerate ? "#71dcff" : "#314653", color: "#031019", fontSize: 16 }}>
          {loading ? "AI is building your ad…" : !selectedProduct ? "Pick a product first" : !platform ? "Choose a platform" : `Generate ${platform} Ad`}
        </button>
        {error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}
      </div>
    </section>

    {result ? <section style={{ display: "grid", gap: 12 }}>
      {[{ label: "Primary copy", value: result.primaryCopy }, { label: "Headline", value: result.headline }, { label: "CTA", value: result.cta }].filter((item) => item.value).map((item) => <div key={item.label} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <strong>{item.label}</strong>
          <button type="button" onClick={() => void copyText(item.value || "")} style={{ border: "1px solid rgba(113,220,255,.35)", borderRadius: 10, background: "transparent", color: "#71dcff", padding: "6px 10px" }}>Copy</button>
        </div>
        <div style={{ marginTop: 9, whiteSpace: "pre-wrap", color: "#dbe9f1", lineHeight: 1.6 }}>{item.value}</div>
      </div>)}
      {result.hashtags?.length ? <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><strong>Hashtags</strong><div style={{ marginTop: 8, color: "#71dcff", lineHeight: 1.6 }}>{result.hashtags.join(" ")}</div></div> : null}
      {result.complianceNotes?.length ? <div style={{ border: "1px solid rgba(255,205,92,.25)", borderRadius: 14, padding: 14, background: "rgba(255,205,92,.05)" }}><strong style={{ color: "#ffd76f" }}>Compliance check</strong><ul style={{ margin: "8px 0 0", paddingLeft: 20, color: "#dbe9f1", lineHeight: 1.6 }}>{result.complianceNotes.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    </section> : null}

    {platformPickerOpen && selectedProduct ? <div role="dialog" aria-modal="true" aria-label="Choose social platform" onClick={() => setPlatformPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 18, background: "rgba(0,0,0,.72)", backdropFilter: "blur(6px)" }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: "min(520px,100%)", border: "1px solid rgba(113,220,255,.32)", borderRadius: 20, padding: 18, background: "#07131d", boxShadow: "0 24px 70px rgba(0,0,0,.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div>
            <div style={{ color: "#71dcff", fontSize: 12, fontWeight: 900 }}>WHERE DO YOU WANT THIS AD?</div>
            <h2 style={{ margin: "5px 0 0" }}>Choose a platform</h2>
            <div style={{ marginTop: 6, color: "#9fb5c5", fontSize: 13, lineHeight: 1.45 }}>{selectedProduct.merchant} — {selectedProduct.title}</div>
          </div>
          <button type="button" onClick={() => setPlatformPickerOpen(false)} aria-label="Close platform picker" style={{ border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, background: "transparent", color: "#dbe9f1", padding: "6px 10px", cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 16 }}>
          {platforms.map((item) => <button key={item} type="button" onClick={() => choosePlatform(item)} style={{ border: platform === item ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.13)", borderRadius: 14, padding: "14px 10px", background: platform === item ? "rgba(113,220,255,.12)" : "rgba(255,255,255,.035)", color: "#eef8ff", fontWeight: 850, cursor: "pointer" }}>{item}</button>)}
        </div>
        <div style={{ marginTop: 14, color: "#8fa6b6", fontSize: 12, lineHeight: 1.5 }}>The AI will tailor the copy, CTA, and formatting for the platform you choose.</div>
      </div>
    </div> : null}
  </div>;
}
