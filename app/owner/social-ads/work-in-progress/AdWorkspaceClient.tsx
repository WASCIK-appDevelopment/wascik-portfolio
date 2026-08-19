"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PhotoAdComposer from "../PhotoAdComposer";
import SaveCurrentAdButton from "../SaveCurrentAdButton";

const SESSION_KEY = "wascik-owner-console-key";
const PUBLIC_BASE = "https://wascik-app-development.netlify.app";
const platforms = ["Facebook", "Instagram", "TikTok", "Threads", "X", "YouTube", "General social post"];

type DraftResult = { primaryCopy?: string; headline?: string; cta?: string; salesLine?: string; hashtags?: string[]; complianceNotes?: string[]; apiUsage?: { model?: string; inputTokens?: number; outputTokens?: number; estimatedCostUsd?: number | null } };
type Draft = {
  id: string; product_id: string; merchant: string; title: string; category?: string | null; description?: string | null; features?: string[] | null; destination_url?: string | null; image_url?: string | null; price?: string | null; page_path?: string | null; source?: string | null;
  platform?: string | null; objective?: string | null; creative_notes?: string | null; subscription_url?: string | null; result?: DraftResult | null; preview_url?: string | null; voice_url?: string | null; updated_at?: string;
};
type ProductForAd = { id: string; merchant: string; title: string; category?: string | null; description?: string | null; features?: string[] | null; affiliate_url?: string | null; image_url?: string | null; price?: string | null; page_path?: string | null };

export default function AdWorkspaceClient() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [platform, setPlatform] = useState("");
  const [objective, setObjective] = useState("");
  const [creativeNotes, setCreativeNotes] = useState("");
  const [result, setResult] = useState<DraftResult | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState("");
  const [voiceIsLocal, setVoiceIsLocal] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastPreviewSizeRef = useRef(0);
  const key = () => sessionStorage.getItem(SESSION_KEY) || "";

  useEffect(() => {
    async function load() {
      setLoading(true); setError("");
      try {
        const response = await fetch("/api/owner/ad-work-progress", { headers: { "x-wascik-owner-key": key() }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load Ad Work in Progress.");
        if (!data.draft) { setDraft(null); return; }
        const next = data.draft as Draft;
        setDraft(next); setPlatform(next.platform || ""); setObjective(next.objective || ""); setCreativeNotes(next.creative_notes || ""); setResult(next.result || null); setSubscriptionUrl(next.subscription_url || "");
        if (next.voice_url) { setVoiceUrl(next.voice_url); setVoiceIsLocal(false); }
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load Ad Work in Progress."); }
      finally { setLoading(false); }
    }
    void load();
    return () => { streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, []);

  useEffect(() => () => { if (voiceIsLocal && voiceUrl) URL.revokeObjectURL(voiceUrl); }, [voiceIsLocal, voiceUrl]);

  async function patch(values: Record<string, unknown>, quiet = false) {
    try {
      const response = await fetch("/api/owner/ad-work-progress", { method: "PATCH", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() }, body: JSON.stringify(values) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save your ad work.");
      if (!quiet) setNotice("Ad work saved.");
    } catch (reason) { if (!quiet) setError(reason instanceof Error ? reason.message : "Could not save your ad work."); }
  }

  useEffect(() => {
    if (!draft || loading) return;
    const timer = window.setTimeout(() => void patch({ objective, creativeNotes }, true), 650);
    return () => window.clearTimeout(timer);
  }, [objective, creativeNotes, draft, loading]);

  useEffect(() => {
    if (!draft) return;
    const timer = window.setInterval(() => {
      const canvas = Array.from(document.querySelectorAll("canvas")).find((item) => item.width > 0 && item.height > 0 && item.offsetParent !== null);
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob || blob.size === lastPreviewSizeRef.current) return;
        lastPreviewSizeRef.current = blob.size;
        const form = new FormData(); form.append("file", blob, "latest-preview.png");
        await fetch("/api/owner/ad-work-progress/preview", { method: "POST", headers: { "x-wascik-owner-key": key() }, body: form }).catch(() => null);
      }, "image/png", .92);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [draft]);

  const product = useMemo<ProductForAd | null>(() => draft ? ({ id: draft.product_id, merchant: draft.merchant, title: draft.title, category: draft.category, description: draft.description, features: draft.features, affiliate_url: draft.destination_url, image_url: draft.image_url, price: draft.price, page_path: draft.page_path }) : null, [draft]);
  const firstParty = draft?.merchant === "WASCIK App Development";

  function verifiedFacts(item: ProductForAd, subscribe: string) {
    return [item.category ? `Category: ${item.category}` : "", item.description ? `Description: ${item.description}` : "", item.features?.length ? `Features: ${item.features.join("; ")}` : "", item.price ? `Stored price: ${item.price}` : "", item.page_path ? `Published WASCIK page: ${item.page_path}` : "", !firstParty && subscribe ? `Email subscription link for this exact ad: ${subscribe}` : "", creativeNotes.trim() ? `Owner creative direction: ${creativeNotes.trim()}` : ""].filter(Boolean).join("\n");
  }

  async function choosePlatform(value: string) { setPlatform(value); await patch({ platform: value }, true); }

  async function generate() {
    if (!product || !platform || generating) return;
    setGenerating(true); setError(""); setNotice("");
    try {
      let subscribe = "";
      if (!firstParty) {
        const path = product.page_path || "/affiliate-services";
        const adKey = `${product.id}-${platform.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`.slice(0, 240);
        const params = new URLSearchParams({ wascik_subscribe: "ad", source_key: adKey, product_id: product.id, platform });
        subscribe = `${PUBLIC_BASE}${path}?${params.toString()}`;
      }
      const response = await fetch("/api/owner/social-ads", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() }, body: JSON.stringify({ platform, merchant: product.merchant, product: product.title, affiliateUrl: product.affiliate_url || "", objective, notes: verifiedFacts(product, subscribe) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate content.");
      const next = data as DraftResult; setResult(next); setSubscriptionUrl(subscribe);
      await patch({ platform, objective, creativeNotes, subscriptionUrl: subscribe, result: next }, true);
      setNotice("Generated and saved to Ad Work in Progress.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not generate content."); }
    finally { setGenerating(false); }
  }

  async function saveVoice(blob: Blob) {
    const form = new FormData(); form.append("file", blob, blob.type.includes("mp4") ? "voice.m4a" : "voice.webm");
    const response = await fetch("/api/owner/ad-work-progress/voice", { method: "POST", headers: { "x-wascik-owner-key": key() }, body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not save the voice recording.");
  }

  async function startRecording() {
    if (!result?.salesLine || recording) return;
    try {
      if (voiceIsLocal && voiceUrl) URL.revokeObjectURL(voiceUrl); setVoiceUrl(""); setVoiceIsLocal(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream; chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime }); recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mime }); const url = URL.createObjectURL(blob); setVoiceUrl(url); setVoiceIsLocal(true); setRecording(false); stream.getTracks().forEach((track) => track.stop());
        try { await saveVoice(blob); setNotice("Voice recording saved with Ad Work in Progress."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the voice recording."); }
      };
      recorder.start(); setRecording(true);
    } catch { setError("Microphone access is required to record your voice."); }
  }
  function stopRecording() { if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop(); }

  function packageText() {
    if (!product || !result) return "";
    return ["WASCIK ADS", `Platform: ${platform}`, `Brand: ${product.merchant}`, `Product/Service: ${product.title}`, product.affiliate_url ? `Destination: ${product.affiliate_url}` : "", subscriptionUrl ? `Subscription link: ${subscriptionUrl}` : "", result.salesLine ? `VOICE SALES LINE\n${result.salesLine}` : "", result.headline ? `HEADLINE\n${result.headline}` : "", result.primaryCopy ? `AD COPY\n${result.primaryCopy}` : "", result.cta ? `CTA\n${result.cta}` : "", result.hashtags?.length ? `HASHTAGS\n${result.hashtags.join(" ")}` : ""].filter(Boolean).join("\n\n");
  }
  function download() { if (!result || !product) return; const blob = new Blob([packageText()], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${product.merchant}-${product.title}-${platform}`.replace(/[^a-z0-9]+/gi, "-").slice(0, 90) + ".txt"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  async function email() {
    if (!result || !product || emailing) return; setEmailing(true); setError("");
    try { const response = await fetch("/api/owner/social-ads/email", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() }, body: JSON.stringify({ merchant: product.merchant, product: product.title, platform, affiliateUrl: product.affiliate_url || "", subscriptionUrl, headline: result.headline || "", primaryCopy: result.primaryCopy || "", cta: result.cta || "", salesLine: result.salesLine || "", hashtags: result.hashtags || [], complianceNotes: result.complianceNotes || [] }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "The ad could not be emailed."); setNotice(data.message || "Ad emailed."); } catch (reason) { setError(reason instanceof Error ? reason.message : "The ad could not be emailed."); } finally { setEmailing(false); }
  }

  const field = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 16 } as const;
  const action = { border: "1px solid rgba(113,220,255,.35)", borderRadius: 11, background: "rgba(113,220,255,.08)", color: "#71dcff", padding: "10px 12px", fontWeight: 850, cursor: "pointer" } as const;

  if (loading) return <div style={{ color: "#71dcff" }}>Opening Ad Work in Progress…</div>;
  if (!draft || !product) return <div style={{ display: "grid", gap: 12 }}><div style={{ color: "#ffcf70" }}>There is no ad in progress yet.</div><button onClick={() => router.push("/owner/social-ads")} style={action}>Back to Social & Ads</button></div>;

  return <div style={{ display: "grid", gap: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}><div><div style={{ color: "#ffd76f", fontSize: 11, fontWeight: 950 }}>AD WORK IN PROGRESS</div><h2 style={{ margin: "4px 0 0" }}>{product.merchant} — {product.title}</h2><div style={{ marginTop: 4, color: "#91a8b7", fontSize: 12 }}>Product, platform, copy, preview and voice are saved persistently as you work.</div></div><button type="button" onClick={() => router.push("/owner/social-ads")} style={action}>← Social & Ads Home</button></div>

    {draft.preview_url ? <section style={{ border: "1px solid rgba(255,215,111,.25)", borderRadius: 14, padding: 12, background: "rgba(255,215,111,.04)" }}><strong style={{ color: "#ffd76f" }}>Last saved preview</strong><div style={{ marginTop: 8 }}><img src={draft.preview_url} alt="Last saved ad preview" style={{ width: "min(320px,100%)", borderRadius: 12, border: "1px solid rgba(255,255,255,.12)" }} /></div></section> : null}

    <section style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 15, background: "rgba(255,255,255,.025)", display: "grid", gap: 12 }}>
      <div><strong>1. Choose platform</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 8, marginTop: 9 }}>{platforms.map((item) => <button key={item} type="button" onClick={() => void choosePlatform(item)} style={{ ...action, background: platform === item ? "#71dcff" : "rgba(113,220,255,.08)", color: platform === item ? "#031019" : "#71dcff" }}>{item}</button>)}</div></div>
      <label style={{ display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 }}>Goal<input value={objective} onChange={(event) => setObjective(event.target.value)} style={field} /></label>
      <label style={{ display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 }}>Optional direction<textarea value={creativeNotes} onChange={(event) => setCreativeNotes(event.target.value)} rows={4} style={{ ...field, resize: "vertical" }} placeholder="Emphasize a feature, say LINK IN BIO, make it energetic, etc." /></label>
      <button type="button" disabled={!platform || generating} onClick={() => void generate()} style={{ border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 950, background: platform && !generating ? "#71dcff" : "#314653", color: "#031019" }}>{generating ? "AI is building your ad…" : platform ? `Generate ${platform} Ad` : "Choose a platform first"}</button>
      {notice ? <div style={{ color: "#8ff0b8", fontSize: 13 }}>{notice}</div> : null}{error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}
    </section>

    {result ? <>
      <PhotoAdComposer product={product} platform={platform} headline={result.headline || product.title} cta={result.cta || (firstParty ? "Learn more from WASCIK" : "Learn more through WASCIK Affiliate Services")} creativeNotes={creativeNotes} />
      {result.salesLine ? <section style={{ border: "1px solid rgba(255,215,111,.3)", borderRadius: 14, padding: 14, background: "rgba(255,215,111,.05)" }}><strong style={{ color: "#ffd76f" }}>Your sales line</strong><div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.55 }}>{result.salesLine}</div><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>{!recording ? <button type="button" onClick={() => void startRecording()} style={action}>{voiceUrl ? "Record Again" : "Record My Voice"}</button> : <button type="button" onClick={stopRecording} style={{ ...action, color: "#ffaaaa" }}>Stop Recording</button>}</div>{voiceUrl ? <><audio controls src={voiceUrl} style={{ width: "100%", marginTop: 10 }} /><div style={{ color: "#8ff0b8", fontSize: 11, marginTop: 5 }}>This voice take is saved with your work in progress.</div></> : null}</section> : null}
      <section style={{ border: "1px solid rgba(143,240,184,.24)", borderRadius: 14, padding: 14, background: "rgba(143,240,184,.035)" }}><strong style={{ color: "#8ff0b8" }}>Final actions</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, marginTop: 10 }}><button type="button" onClick={download} style={action}>Download to My Phone</button><button type="button" onClick={() => void email()} disabled={emailing} style={action}>{emailing ? "Emailing…" : "Email Ad"}</button><SaveCurrentAdButton brand={product.merchant} productOrService={product.title} platform={platform} headline={result.headline} primaryCopy={result.primaryCopy} cta={result.cta} salesLine={result.salesLine} hashtags={result.hashtags} /></div></section>
      {[{ label: "Headline", value: result.headline }, { label: "Primary copy", value: result.primaryCopy }, { label: "CTA", value: result.cta }].filter((x) => x.value).map((item) => <section key={item.label} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.025)" }}><strong>{item.label}</strong><div style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{item.value}</div></section>)}
    </> : null}
  </div>;
}
