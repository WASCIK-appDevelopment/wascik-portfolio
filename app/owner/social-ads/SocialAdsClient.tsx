"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PhotoAdComposer from "./PhotoAdComposer";
import SavedAdLibrary from "./SavedAdLibrary";
import SaveCurrentAdButton from "./SaveCurrentAdButton";

const SESSION_KEY = "wascik-owner-console-key";
const PUBLIC_AFFILIATE_BASE = "https://wascik-app-development.netlify.app";
const AD_BUDGET_KEY = "wascik-openai-ad-budget-spent-usd";
const DEFAULT_AD_BUDGET_USD = 5;
const WASCIK_BRAND = "WASCIK App Development";

type ApiUsage = { model?: string; inputTokens?: number; outputTokens?: number; estimatedCostUsd?: number | null };
type DraftResult = { primaryCopy?: string; headline?: string; cta?: string; salesLine?: string; hashtags?: string[]; complianceNotes?: string[]; apiUsage?: ApiUsage };
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
  const [subscriptionUrl, setSubscriptionUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [trackedSpend, setTrackedSpend] = useState(0);
  const [recording, setRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const storedSpend = Number(localStorage.getItem(AD_BUDGET_KEY) || "0");
    if (Number.isFinite(storedSpend) && storedSpend >= 0) setTrackedSpend(storedSpend);
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    async function loadCatalog() {
      setCatalogLoading(true);
      try {
        const response = await fetch("/api/owner/affiliate-search/approved", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load your products and services.");
        const published = (Array.isArray(data.products) ? data.products as CatalogProduct[] : [])
          .filter((item) => Boolean(item.published_at))
          .sort((a, b) => `${a.merchant} ${a.title}`.localeCompare(`${b.merchant} ${b.title}`));
        setProducts(published);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load your products and services.");
      } finally { setCatalogLoading(false); }
    }
    void loadCatalog();
    return () => { streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, []);

  useEffect(() => () => { if (voiceUrl) URL.revokeObjectURL(voiceUrl); }, [voiceUrl]);

  const selectedProduct = useMemo(() => products.find((item) => item.id === selectedId) || null, [products, selectedId]);
  const wascikProducts = useMemo(() => products.filter((item) => item.merchant === WASCIK_BRAND), [products]);
  const affiliateProducts = useMemo(() => products.filter((item) => item.merchant !== WASCIK_BRAND), [products]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return affiliateProducts;
    return affiliateProducts.filter((item) => [item.merchant, item.title, item.category || ""].some((value) => value.toLowerCase().includes(query)));
  }, [affiliateProducts, search]);
  const isFirstParty = selectedProduct?.merchant === WASCIK_BRAND;
  const canGenerate = Boolean(platform && selectedProduct && !loading);
  const trackedRemaining = Math.max(0, DEFAULT_AD_BUDGET_USD - trackedSpend);

  function addTrackedCost(cost: number) {
    if (!Number.isFinite(cost) || cost <= 0) return;
    setTrackedSpend((current) => { const next = current + cost; localStorage.setItem(AD_BUDGET_KEY, String(next)); return next; });
  }
  function clearVoice() { if (voiceUrl) URL.revokeObjectURL(voiceUrl); setVoiceBlob(null); setVoiceUrl(""); }
  function selectProduct(item: CatalogProduct) {
    setSelectedId(item.id); setPlatform(""); setResult(null); setSubscriptionUrl(""); clearVoice(); setNotice(""); setError("");
    setObjective(item.merchant === WASCIK_BRAND ? `Drive qualified interest in WASCIK ${item.title}` : "Drive product interest and affiliate clicks");
    setPlatformPickerOpen(true);
  }
  function choosePlatform(value: string) { setPlatform(value); setPlatformPickerOpen(false); setResult(null); setSubscriptionUrl(""); clearVoice(); setNotice(""); }

  function verifiedFacts(item: CatalogProduct, adSubscriptionUrl: string) {
    const firstParty = item.merchant === WASCIK_BRAND;
    return [
      item.category ? `Category: ${item.category}` : "",
      item.description ? `Description: ${item.description}` : "",
      item.features?.length ? `Features: ${item.features.join("; ")}` : "",
      item.price ? `Stored price: ${item.price}` : "",
      item.page_path ? `Published WASCIK page: ${item.page_path}` : "",
      !firstParty && adSubscriptionUrl ? `Email subscription link for this exact ad: ${adSubscriptionUrl}` : "",
      firstParty ? "This is a first-party WASCIK App Development service, not an affiliate product." : "",
      creativeNotes.trim() ? `Owner creative direction: ${creativeNotes.trim()}` : "",
    ].filter(Boolean).join("\n");
  }

  async function generate() {
    if (!canGenerate || !selectedProduct) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    const firstParty = selectedProduct.merchant === WASCIK_BRAND;
    let adSubscriptionUrl = "";
    if (!firstParty) {
      const pagePath = selectedProduct.page_path || "/affiliate-services";
      const adKey = `${selectedProduct.id}-${platform.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`.slice(0, 240);
      const params = new URLSearchParams({ wascik_subscribe: "ad", source_key: adKey, product_id: selectedProduct.id, platform });
      adSubscriptionUrl = `${PUBLIC_AFFILIATE_BASE}${pagePath}?${params.toString()}`;
    }
    setLoading(true); setError(""); setNotice(""); setResult(null); clearVoice(); setSubscriptionUrl(adSubscriptionUrl);
    try {
      const response = await fetch("/api/owner/social-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ platform, merchant: selectedProduct.merchant, product: selectedProduct.title, affiliateUrl: selectedProduct.affiliate_url || "", objective, notes: verifiedFacts(selectedProduct, adSubscriptionUrl) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate content.");
      const next = data as DraftResult; setResult(next);
      const cost = Number(next.apiUsage?.estimatedCostUsd); if (Number.isFinite(cost) && cost > 0) addTrackedCost(cost);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not generate content."); }
    finally { setLoading(false); }
  }

  async function startRecording() {
    if (!result?.salesLine || recording) return; setError(""); setNotice(""); clearVoice();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; chunksRef.current = [];
      const preferred = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: preferred }); recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || preferred }); const url = URL.createObjectURL(blob);
        setVoiceBlob(blob); setVoiceUrl(url); setRecording(false); stream.getTracks().forEach((track) => track.stop()); streamRef.current = null; setNotice("Your exact voice recording is attached to this ad draft.");
      };
      recorder.start(); setRecording(true);
    } catch { setError("Microphone access is required to record your voice in the console."); }
  }
  function stopRecording() { const recorder = recorderRef.current; if (recorder && recorder.state !== "inactive") recorder.stop(); }

  function adPackageText() {
    if (!result || !selectedProduct) return "";
    const firstParty = selectedProduct.merchant === WASCIK_BRAND;
    return [
      "WASCIK ADS", `Platform: ${platform}`, `Brand: ${selectedProduct.merchant}`, `${firstParty ? "Service" : "Product"}: ${selectedProduct.title}`,
      selectedProduct.affiliate_url ? `${firstParty ? "Destination" : "Affiliate link"}: ${selectedProduct.affiliate_url}` : "",
      subscriptionUrl ? `Email subscription link: ${subscriptionUrl}` : "",
      result.apiUsage?.estimatedCostUsd != null ? `Estimated OpenAI cost for copy: $${result.apiUsage.estimatedCostUsd.toFixed(6)}` : "",
      result.salesLine ? `VOICE SALES LINE\n${result.salesLine}` : "", voiceBlob ? "VOICE RECORDING: Included as a separate audio component." : "",
      result.headline ? `HEADLINE\n${result.headline}` : "", result.primaryCopy ? `AD COPY\n${result.primaryCopy}` : "", result.cta ? `CTA\n${result.cta}` : "",
      result.hashtags?.length ? `HASHTAGS\n${result.hashtags.join(" ")}` : "", result.complianceNotes?.length ? `COMPLIANCE NOTES\n- ${result.complianceNotes.join("\n- ")}` : "",
    ].filter(Boolean).join("\n\n");
  }
  function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function safeBaseName() { if (!selectedProduct) return "WASCIK-Ad"; return `${selectedProduct.merchant}-${selectedProduct.title}-${platform}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 90) || "WASCIK-Ad"; }
  function downloadAd() {
    if (!result || !selectedProduct) return; const base = safeBaseName(); downloadBlob(new Blob([adPackageText()], { type: "text/plain;charset=utf-8" }), `${base}.txt`);
    if (voiceBlob) { const extension = voiceBlob.type.includes("mp4") ? "m4a" : "webm"; setTimeout(() => downloadBlob(voiceBlob, `${base}-voice.${extension}`), 300); setNotice("Written ad package and your exact voice recording downloaded to your device."); }
    else setNotice("Written ad package downloaded. The finished picture can also be saved permanently to My Ad Library.");
  }

  async function emailAd() {
    if (!result || !selectedProduct || emailing) return; const key = sessionStorage.getItem(SESSION_KEY) || ""; setEmailing(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/owner/social-ads/email", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key }, body: JSON.stringify({ merchant: selectedProduct.merchant, product: selectedProduct.title, platform, affiliateUrl: selectedProduct.affiliate_url || "", subscriptionUrl, headline: result.headline || "", primaryCopy: result.primaryCopy || "", cta: result.cta || "", salesLine: result.salesLine || "", hashtags: result.hashtags || [], complianceNotes: result.complianceNotes || [] }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "The ad could not be emailed."); setNotice(data.message || "Ad emailed from WASCIK Ads.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The ad could not be emailed."); }
    finally { setEmailing(false); }
  }

  async function copyText(text: string) { try { await navigator.clipboard.writeText(text); } catch {} }
  const fieldStyle = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 16 } as const;
  const labelStyle = { display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 } as const;
  const actionButton = { border: "1px solid rgba(113,220,255,.35)", borderRadius: 11, background: "rgba(113,220,255,.08)", color: "#71dcff", padding: "10px 12px", fontWeight: 850, cursor: "pointer" } as const;
  const cardStyle = (selected: boolean) => ({ textAlign: "left" as const, border: selected ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.11)", borderRadius: 14, padding: 10, background: selected ? "rgba(113,220,255,.10)" : "rgba(255,255,255,.03)", color: "#eef8ff", cursor: "pointer" });

  return <div style={{ display: "grid", gap: 16 }}>
    <section style={{ border: "1px solid rgba(113,220,255,.38)", borderRadius: 18, padding: 16, background: "linear-gradient(135deg,rgba(12,62,91,.35),rgba(7,24,39,.7))" }}>
      <div style={{ color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".13em" }}>WASCIK FIRST-PARTY · QUICK ACCESS</div>
      <h2 style={{ margin: "6px 0 5px" }}>WASCIK App Development</h2>
      <p style={{ margin: "0 0 12px", color: "#a9bdcc", lineHeight: 1.5 }}>Your own products and services stay pinned here above every affiliate brand. Tap one and choose the platform—no catalog search required.</p>
      {catalogLoading ? <div style={{ color: "#71dcff" }}>Loading WASCIK services…</div> : null}
      {!catalogLoading && !wascikProducts.length ? <div style={{ color: "#ffcf70" }}>WASCIK services did not load. Refresh the console before testing ads.</div> : null}
      {wascikProducts.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(165px,1fr))", gap: 9 }}>
        {wascikProducts.map((item) => <button key={item.id} type="button" onClick={() => selectProduct(item)} style={cardStyle(item.id === selectedId)}>
          <div style={{ color: "#71dcff", fontSize: 11, fontWeight: 900 }}>WASCIK SERVICE</div><div style={{ marginTop: 5, fontWeight: 900 }}>{item.title}</div>
          {item.category ? <div style={{ marginTop: 5, color: "#9fb5c5", fontSize: 11 }}>{item.category}</div> : null}
          {item.title === "AI Owner Console" ? <div style={{ marginTop: 6, color: "#ffd76f", fontSize: 10, fontWeight: 850 }}>FUTURE OFFER</div> : null}
        </button>)}
      </div> : null}
    </section>

    <SavedAdLibrary />

    <section style={{ border: "1px solid rgba(113,220,255,.18)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div><h2 style={{ margin: 0 }}>Affiliate products</h2><p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.55 }}>Search your published affiliate catalog only when you want an outside brand or product.</p></div>
        <div style={{ border: "1px solid rgba(255,215,111,.25)", borderRadius: 14, padding: 13, background: "rgba(255,215,111,.05)" }}><strong style={{ color: "#ffd76f" }}>Tracked OpenAI ad budget: ${trackedRemaining.toFixed(4)} left of ${DEFAULT_AD_BUDGET_USD.toFixed(2)}</strong><div style={{ marginTop: 5, color: "#aebeca", fontSize: 12 }}>The Owner Console gauges above remain the main account-usage view.</div></div>
        <label style={labelStyle}>Find an affiliate product<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, brand, or category" style={fieldStyle} /></label>
        {catalogLoading ? <div style={{ color: "#71dcff" }}>Loading affiliate catalog…</div> : null}
        {!catalogLoading && !affiliateProducts.length ? <div style={{ color: "#ffcf70" }}>No published affiliate products were found.</div> : null}
        {!catalogLoading && filteredProducts.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10, maxHeight: 430, overflowY: "auto" }}>
          {filteredProducts.map((item) => <button key={item.id} type="button" onClick={() => selectProduct(item)} style={cardStyle(item.id === selectedId)}>
            {item.image_url ? <img src={item.image_url} alt="" style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 10, background: "rgba(255,255,255,.04)", marginBottom: 9 }} /> : null}
            <div style={{ color: "#71dcff", fontSize: 12, fontWeight: 800 }}>{item.merchant}</div><div style={{ marginTop: 4, fontWeight: 800 }}>{item.title}</div>{item.category ? <div style={{ marginTop: 5, color: "#9fb5c5", fontSize: 12 }}>{item.category}</div> : null}
          </button>)}
        </div> : null}
      </div>
    </section>

    <section style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 16, background: "rgba(255,255,255,.025)" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Create the ad</h2>
        {selectedProduct ? <div style={{ color: isFirstParty ? "#8ff0b8" : "#71dcff", fontWeight: 850 }}>{selectedProduct.merchant} · {selectedProduct.title}</div> : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <div style={labelStyle}>Platform<button type="button" disabled={!selectedProduct} onClick={() => setPlatformPickerOpen(true)} style={{ ...fieldStyle, textAlign: "left", cursor: selectedProduct ? "pointer" : "not-allowed" }}>{platform || (selectedProduct ? "Choose platform" : "Pick a product or service first")}</button></div>
          <label style={labelStyle}>Goal<input value={objective} onChange={(event) => setObjective(event.target.value)} style={fieldStyle} /></label>
        </div>
        <label style={labelStyle}>Optional direction<textarea value={creativeNotes} onChange={(event) => setCreativeNotes(event.target.value)} rows={3} placeholder="Optional: emphasize a feature, say LINK IN BIO, make it energetic, etc." style={{ ...fieldStyle, resize: "vertical" }} /></label>
        <button type="button" disabled={!canGenerate} onClick={generate} style={{ border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 900, cursor: canGenerate ? "pointer" : "not-allowed", background: canGenerate ? "#71dcff" : "#314653", color: "#031019", fontSize: 16 }}>{loading ? "AI is building your ad…" : !selectedProduct ? "Pick a product or service first" : !platform ? "Choose a platform" : `Generate ${platform} Ad`}</button>
        {error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}{notice ? <div style={{ color: "#8ff0b8", fontSize: 13 }}>{notice}</div> : null}
      </div>
    </section>

    {result && selectedProduct ? <section style={{ display: "grid", gap: 12 }}>
      {result.apiUsage ? <div style={{ border: "1px solid rgba(143,240,184,.28)", borderRadius: 14, padding: 14, background: "rgba(143,240,184,.06)" }}><strong style={{ color: "#8ff0b8" }}>OpenAI usage for this ad</strong><div style={{ marginTop: 7, color: "#dbe9f1" }}>Model: {result.apiUsage.model || "unknown"} · Input: {result.apiUsage.inputTokens || 0} tokens · Output: {result.apiUsage.outputTokens || 0} tokens</div><div style={{ marginTop: 5, fontWeight: 900 }}>Estimated copy cost: {result.apiUsage.estimatedCostUsd != null ? `$${result.apiUsage.estimatedCostUsd.toFixed(6)}` : "pricing unavailable"}</div><div style={{ marginTop: 5, color: "#aebeca", fontSize: 12 }}>Tracked ad budget remaining: ${trackedRemaining.toFixed(4)} of ${DEFAULT_AD_BUDGET_USD.toFixed(2)}</div></div> : null}

      <PhotoAdComposer product={selectedProduct} platform={platform} headline={result.headline || selectedProduct.title} cta={result.cta || (isFirstParty ? "Learn more about WASCIK" : "Learn more through WASCIK Affiliate Services")} creativeNotes={creativeNotes} onImageCost={addTrackedCost} />

      {result.salesLine ? <div style={{ border: "1px solid rgba(255,215,111,.3)", borderRadius: 14, padding: 14, background: "rgba(255,215,111,.05)" }}><strong style={{ color: "#ffd76f" }}>Your sales line — read this in your voice</strong><div style={{ marginTop: 9, fontSize: 18, lineHeight: 1.55, color: "#f4f8fb" }}>{result.salesLine}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>{!recording ? <button type="button" onClick={() => void startRecording()} style={actionButton}>{voiceBlob ? "Record Again" : "Record My Voice"}</button> : <button type="button" onClick={stopRecording} style={{ ...actionButton, borderColor: "rgba(255,120,120,.5)", color: "#ffaaaa" }}>Stop Recording</button>}<button type="button" onClick={() => void copyText(result.salesLine || "")} style={actionButton}>Copy Sales Line</button></div>{recording ? <div style={{ marginTop: 10, color: "#ffaaaa", fontWeight: 850 }}>● Recording your microphone…</div> : null}{voiceUrl ? <div style={{ marginTop: 12 }}><audio controls src={voiceUrl} style={{ width: "100%" }} /><div style={{ marginTop: 7, color: "#8ff0b8", fontSize: 12 }}>This is your exact recording—no AI voice generation.</div></div> : null}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
        <button type="button" onClick={downloadAd} style={actionButton}>Download to My Phone</button>
        <button type="button" disabled={emailing} onClick={() => void emailAd()} style={{ ...actionButton, opacity: emailing ? .6 : 1 }}>{emailing ? "Emailing…" : "Email Ad"}</button>
        <SaveCurrentAdButton brand={selectedProduct.merchant} productOrService={selectedProduct.title} platform={platform} headline={result.headline} primaryCopy={result.primaryCopy} cta={result.cta} salesLine={result.salesLine} hashtags={result.hashtags} />
      </div>
      <div style={{ color: "#91a8b7", fontSize: 12, lineHeight: 1.5 }}>After the photo preview is exactly how you want it, “Save to My Ad Library” stores the finished picture and its written copy privately so you can retrieve it later without filling your phone’s Photos library.</div>
      {subscriptionUrl ? <div style={{ border: "1px solid rgba(143,240,184,.25)", borderRadius: 14, padding: 14, background: "rgba(143,240,184,.05)" }}><strong style={{ color: "#8ff0b8" }}>Email subscription link for this ad</strong><div style={{ marginTop: 8, wordBreak: "break-all", color: "#dbe9f1", fontSize: 13 }}>{subscriptionUrl}</div><button type="button" onClick={() => void copyText(subscriptionUrl)} style={{ ...actionButton, marginTop: 10 }}>Copy Subscribe Link</button></div> : null}
      {[{ label: "Primary copy", value: result.primaryCopy }, { label: "Headline", value: result.headline }, { label: "CTA", value: result.cta }].filter((item) => item.value).map((item) => <div key={item.label} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>{item.label}</strong><button type="button" onClick={() => void copyText(item.value || "")} style={{ ...actionButton, padding: "6px 10px" }}>Copy</button></div><div style={{ marginTop: 9, whiteSpace: "pre-wrap", color: "#dbe9f1", lineHeight: 1.6 }}>{item.value}</div></div>)}
      {result.hashtags?.length ? <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><strong>Hashtags</strong><div style={{ marginTop: 8, color: "#71dcff" }}>{result.hashtags.join(" ")}</div></div> : null}
      {result.complianceNotes?.length ? <div style={{ border: "1px solid rgba(255,205,92,.25)", borderRadius: 14, padding: 14, background: "rgba(255,205,92,.05)" }}><strong style={{ color: "#ffd76f" }}>Compliance check</strong><ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>{result.complianceNotes.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
    </section> : null}

    {platformPickerOpen && selectedProduct ? <div role="dialog" aria-modal="true" aria-label="Choose social platform" onClick={() => setPlatformPickerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: 18, background: "rgba(0,0,0,.72)" }}><div onClick={(event) => event.stopPropagation()} style={{ width: "min(520px,100%)", border: "1px solid rgba(113,220,255,.32)", borderRadius: 20, padding: 18, background: "#07131d" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><div style={{ color: "#71dcff", fontSize: 12, fontWeight: 900 }}>WHERE DO YOU WANT THIS AD?</div><h2 style={{ margin: "5px 0 0" }}>Choose a platform</h2><div style={{ marginTop: 6, color: "#9fb5c5", fontSize: 13 }}>{selectedProduct.merchant} — {selectedProduct.title}</div></div><button type="button" onClick={() => setPlatformPickerOpen(false)} style={{ ...actionButton, height: 36 }}>✕</button></div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginTop: 16 }}>{platforms.map((item) => <button key={item} type="button" onClick={() => choosePlatform(item)} style={{ border: platform === item ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.13)", borderRadius: 14, padding: "14px 10px", background: platform === item ? "rgba(113,220,255,.12)" : "rgba(255,255,255,.035)", color: "#eef8ff", fontWeight: 850, cursor: "pointer" }}>{item}</button>)}</div></div></div> : null}
  </div>;
}
