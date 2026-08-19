"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SavedAdLibrary from "./SavedAdLibrary";

const SESSION_KEY = "wascik-owner-console-key";

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
  source?: string | null;
};

type DraftSummary = {
  merchant?: string;
  title?: string;
  platform?: string | null;
  updated_at?: string;
  preview_url?: string;
};

export default function SocialAdsClient() {
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState("");
  const [draft, setDraft] = useState<DraftSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [catalogResponse, draftResponse] = await Promise.all([
          fetch("/api/owner/affiliate-search/approved", { headers: { "x-wascik-owner-key": key }, cache: "no-store" }),
          fetch("/api/owner/ad-work-progress", { headers: { "x-wascik-owner-key": key }, cache: "no-store" }),
        ]);
        const catalog = await catalogResponse.json().catch(() => ({}));
        const draftData = await draftResponse.json().catch(() => ({}));
        if (!catalogResponse.ok) throw new Error(catalog.error || "Could not load products and services.");
        const published = (Array.isArray(catalog.products) ? catalog.products as CatalogProduct[] : [])
          .filter((item) => Boolean(item.published_at))
          .map((item) => item.merchant === "WASCIK App Development" ? { ...item, image_url: null } : item)
          .sort((a, b) => `${a.merchant} ${a.title}`.localeCompare(`${b.merchant} ${b.title}`));
        setProducts(published);
        if (draftResponse.ok && draftData.draft) setDraft(draftData.draft as DraftSummary);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load Social & Ads.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const wascikServices = useMemo(() => products.filter((item) => item.merchant === "WASCIK App Development"), [products]);
  const affiliateProducts = useMemo(() => products.filter((item) => item.merchant !== "WASCIK App Development"), [products]);
  const filteredAffiliate = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return affiliateProducts;
    return affiliateProducts.filter((item) => [item.merchant, item.title, item.category || ""].some((value) => value.toLowerCase().includes(query)));
  }, [affiliateProducts, search]);

  async function startAd(item: CatalogProduct) {
    if (opening) return;
    if (draft && !window.confirm(`Replace your current ad in progress (${draft.merchant || "Ad"} — ${draft.title || "current draft"}) with ${item.merchant} — ${item.title}?`)) return;
    setOpening(item.id);
    setError("");
    try {
      const key = sessionStorage.getItem(SESSION_KEY) || "";
      const safeItem = item.merchant === "WASCIK App Development" ? { ...item, image_url: null } : item;
      const response = await fetch("/api/owner/ad-work-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ product: safeItem }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not open the ad workspace.");
      router.push("/owner/social-ads/work-in-progress");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open the ad workspace.");
      setOpening("");
    }
  }

  const cardStyle = (item: CatalogProduct, firstParty = false) => ({
    textAlign: "left" as const,
    border: firstParty ? "1px solid rgba(113,220,255,.38)" : "1px solid rgba(255,255,255,.11)",
    borderRadius: 14,
    padding: 11,
    background: firstParty ? "linear-gradient(145deg,rgba(22,111,168,.18),rgba(255,255,255,.03))" : "rgba(255,255,255,.03)",
    color: "#eef8ff",
    cursor: opening ? "wait" : "pointer",
    minHeight: 92,
  });

  return <div style={{ display: "grid", gap: 16 }}>
    <section style={{ border: "1px solid rgba(255,215,111,.36)", borderRadius: 17, padding: 14, background: "linear-gradient(135deg,rgba(255,215,111,.08),rgba(5,20,33,.88))" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#ffd76f", fontSize: 11, fontWeight: 950, letterSpacing: ".13em" }}>AD WORK IN PROGRESS</div>
          <strong style={{ display: "block", marginTop: 5, fontSize: 19 }}>{draft ? `${draft.merchant || "Ad"} — ${draft.title || "Current draft"}` : "No current ad draft"}</strong>
          {draft ? <div style={{ marginTop: 5, color: "#aebeca", fontSize: 12 }}>{draft.platform || "Platform not chosen yet"}{draft.updated_at ? ` · saved ${new Date(draft.updated_at).toLocaleString()}` : ""}</div> : <div style={{ marginTop: 5, color: "#aebeca", fontSize: 12 }}>Choose any service or product below to start a persistent workspace.</div>}
        </div>
        <button type="button" disabled={!draft} onClick={() => router.push("/owner/social-ads/work-in-progress")} style={{ border: 0, borderRadius: 12, background: draft ? "#ffd76f" : "#39424a", color: draft ? "#07111d" : "#91a0aa", padding: "11px 14px", fontWeight: 950, cursor: draft ? "pointer" : "not-allowed" }}>{draft ? "Continue My Ad Work" : "Ad Work in Progress"}</button>
      </div>
      {draft?.preview_url ? <img src={draft.preview_url} alt="Latest ad work preview" style={{ width: 96, height: 120, objectFit: "cover", borderRadius: 10, marginTop: 12, border: "1px solid rgba(255,255,255,.12)" }} /> : null}
    </section>

    <section style={{ border: "1px solid rgba(113,220,255,.28)", borderRadius: 17, padding: 15, background: "rgba(113,220,255,.035)" }}>
      <div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".13em" }}>WASCIK APP DEVELOPMENT</div><h2 style={{ margin: "5px 0 0" }}>My Products & Services</h2><p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.5 }}>Pinned first. WASCIK service imagery is owner-approved only—no automatic affiliate or web image recovery is used here.</p></div>
      {loading ? <div style={{ marginTop: 12, color: "#71dcff" }}>Loading WASCIK services…</div> : null}
      {!loading && wascikServices.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, marginTop: 13 }}>
        {wascikServices.map((item) => <button key={item.id} type="button" onClick={() => void startAd(item)} style={cardStyle(item, true)} disabled={Boolean(opening)}><div style={{ minHeight: 52, borderRadius: 10, border: "1px solid rgba(113,220,255,.18)", background: "radial-gradient(circle at 20% 20%,rgba(113,220,255,.18),rgba(3,12,21,.75))", display: "grid", placeItems: "center", color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".12em", marginBottom: 8 }}>WASCIK APPROVED MEDIA</div><div style={{ color: "#71dcff", fontSize: 10, fontWeight: 900 }}>{item.category || "WASCIK SERVICE"}</div><div style={{ marginTop: 5, fontSize: 15, fontWeight: 900 }}>{item.title}</div><div style={{ marginTop: 5, color: "#9fb5c5", fontSize: 11 }}>{opening === item.id ? "Opening workspace…" : "Tap to build an ad →"}</div></button>)}
      </div> : null}
    </section>

    <SavedAdLibrary />

    <section style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 17, padding: 15, background: "rgba(255,255,255,.025)" }}>
      <div><div style={{ color: "#8fa6b6", fontSize: 11, fontWeight: 950, letterSpacing: ".12em" }}>AFFILIATE ADVERTISING</div><h2 style={{ margin: "5px 0 0" }}>Affiliate products</h2><p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.5 }}>Search only when you want an affiliate product. Tapping one opens the dedicated ad workspace.</p></div>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search affiliate brand, product, or category" style={{ width: "100%", marginTop: 13, borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 16 }} />
      {error ? <div style={{ marginTop: 10, color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}
      {!loading && filteredAffiliate.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 9, marginTop: 13, maxHeight: 470, overflowY: "auto" }}>
        {filteredAffiliate.map((item) => <button key={item.id} type="button" onClick={() => void startAd(item)} style={cardStyle(item)} disabled={Boolean(opening)}>{item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", height: 105, objectFit: "contain", borderRadius: 9, background: "rgba(255,255,255,.04)", marginBottom: 8 }} /> : null}<div style={{ color: "#71dcff", fontSize: 11, fontWeight: 850 }}>{item.merchant}</div><div style={{ marginTop: 4, fontWeight: 900 }}>{item.title}</div>{item.category ? <div style={{ marginTop: 4, color: "#91a8b7", fontSize: 11 }}>{item.category}</div> : null}</button>)}
      </div> : null}
    </section>
  </div>;
}