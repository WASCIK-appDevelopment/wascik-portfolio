"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { resolveCreativeProfile } from "../../../lib/ai/socialAdCreativeProfile";
import "./photo-ad-composer-v3.css";

const SESSION_KEY = "wascik-owner-console-key";
const HOUSE_DEFAULT_PROMPT = "Build the strongest polished WASCIK-style social ad for this product or service. Preserve the owner closely when an owner photo is used, make the product or service benefit obvious, keep important text away from the face and product, use concise benefit-driven copy, and use a strong platform-appropriate CTA.";

type ProductForAd = { id: string; merchant: string; title: string; category?: string | null; image_url?: string | null };
type Props = { product: ProductForAd; platform: string; headline: string; cta: string; visualHook?: string; visualSupportLine?: string; visualCta?: string; creativeNotes?: string; onImageCost?: (cost: number) => void };
type Quality = "low" | "medium" | "high";
type Layout = "square" | "portrait" | "story";
type Style = "clean-product" | "social" | "reel-cover" | "flyer";
type CreativeMode = "product" | "composite" | "lifestyle";
type Refinement = "balanced" | "premium" | "bold" | "minimal" | "lifestyle";
type IdentityLock = "strong" | "medium" | "flexible";
type HeroPriority = "product" | "shared" | "owner";
type CopyZone = "top" | "bottom";
type SavedPhoto = { id: string; label: string; category: string; url: string };
type ValidationResult = { pass?: boolean; identityScore?: number; productScore?: number; interactionScore?: number; heroScore?: number; recommendedCopyZone?: CopyZone; reasons?: string[] };
type ImageResult = { imageDataUrl?: string; model?: string; estimatedCostUsd?: number | null; error?: string };
type EditResult = ImageResult & { productReferenceIncluded?: boolean; recommendedCopyZone?: CopyZone; attemptsUsed?: number; validation?: ValidationResult };
type EditedScene = { url: string; productReferenceIncluded: boolean; copyZone: CopyZone; attemptsUsed: number; validation?: ValidationResult };
type DirectorPlan = { creativeMode?: CreativeMode; identityLock?: IdentityLock; heroPriority?: HeroPriority; gaze?: string; expression?: string; interaction?: string; refinement?: Refinement; style?: Style; layout?: Layout; visualHook?: string; visualSupportLine?: string; visualCta?: string; sceneBrief?: string; negativeConstraints?: string[]; directorSummary?: string };

const dims: Record<Layout, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: "Square · 1:1" },
  portrait: { width: 1080, height: 1350, label: "Portrait · 4:5" },
  story: { width: 1080, height: 1920, label: "Story / Reel · 9:16" },
};
const categories = ["General", "Business", "Welding", "Gaming", "Hunting", "Poolside", "Fashion", "Wellness / RevoMatic"];
const gazes = ["Look at viewer", "Look at product", "Look at screen / workspace", "Look off to the side", "Preserve original"];
const expressions = ["Friendly", "Confident", "Focused", "Serious", "Energetic", "Preserve original"];
const interactions = ["Preserve original pose", "Hold the product clearly in my hand", "Put the tool in my hand", "Show me using the product", "Show me wearing the product", "Sit on / use the product naturally", "Stand beside the product", "Product featured prominently in foreground", "Product displayed next to me"];
const genericCtas = new Set(["learn more", "see details", "view catalog", "explore", "explore now", "shop", "shop now", "view details"]);

function loadImage(src: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.crossOrigin = "anonymous"; image.onload = () => resolve(image); image.onerror = reject; image.src = src; }); }
function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) { const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight); const dw = image.naturalWidth * scale; const dh = image.naturalHeight * scale; ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
function contain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) { const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight); const dw = image.naturalWidth * scale; const dh = image.naturalHeight * scale; ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); }
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { const radius = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius); ctx.arcTo(x + w, y + h, x, y + h, radius); ctx.arcTo(x, y + h, x, y, radius); ctx.arcTo(x, y, x + w, y, radius); ctx.closePath(); }
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) { const words = text.trim().split(/\s+/); const lines: string[] = []; let line = ""; for (const word of words) { const test = line ? `${line} ${word}` : word; if (!line || ctx.measureText(test).width <= max) line = test; else { lines.push(line); line = word; } } if (line) lines.push(line); return lines; }
function compact(text: string, max: number) { const s = text.trim().replace(/\s+/g, " "); return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`; }
function platformAwareCta(platform: string, visualCta: string, cta: string) { const candidate = compact(visualCta || (cta.length < 28 ? cta : ""), 24).trim(); const bio = /instagram|tiktok|threads/i.test(platform); if (!candidate || genericCtas.has(candidate.toLowerCase())) return bio ? "LINK IN BIO" : "SEE DETAILS"; return candidate.toUpperCase(); }

export default function PhotoAdComposerV5({ product, platform, headline, cta, visualHook = "", visualSupportLine = "", visualCta = "", creativeNotes = "", onImageCost }: Props) {
  const profile = useMemo(() => resolveCreativeProfile(product.merchant, product.category || "", product.title), [product.merchant, product.category, product.title]);
  const [quality, setQuality] = useState<Quality>("medium");
  const [layout, setLayout] = useState<Layout>(platform === "TikTok" ? "story" : "portrait");
  const [style, setStyle] = useState<Style>("clean-product");
  const [creativeMode, setCreativeMode] = useState<CreativeMode>(profile.defaultMode);
  const [refinement, setRefinement] = useState<Refinement>("premium");
  const [identityLock, setIdentityLock] = useState<IdentityLock>("strong");
  const [heroPriority, setHeroPriority] = useState<HeroPriority>("shared");
  const [background, setBackground] = useState("");
  const [ownerUrl, setOwnerUrl] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [editedOwnerUrl, setEditedOwnerUrl] = useState("");
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [photoCategory, setPhotoCategory] = useState("General");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gaze, setGaze] = useState("Preserve original");
  const [expression, setExpression] = useState("Preserve original");
  const [interaction, setInteraction] = useState("Preserve original pose");
  const [directions, setDirections] = useState("");
  const [directorPrompt, setDirectorPrompt] = useState("");
  const [directorPlan, setDirectorPlan] = useState<DirectorPlan | null>(null);
  const [model, setModel] = useState("");
  const [backgroundCost, setBackgroundCost] = useState<number | null>(null);
  const [editCost, setEditCost] = useState<number | null>(null);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [lastAttempts, setLastAttempts] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const heroOwner = editedOwnerUrl || ownerUrl;
  const hook = compact(directorPlan?.visualHook || visualHook || headline || product.title, 58);
  const support = compact(directorPlan?.visualSupportLine || visualSupportLine || "", 84);
  const button = platformAwareCta(platform, directorPlan?.visualCta || visualCta, cta);
  const key = () => sessionStorage.getItem(SESSION_KEY) || "";

  useEffect(() => { void loadLibrary(); }, []);
  useEffect(() => { setCreativeMode(profile.defaultMode); }, [profile.defaultMode]);

  async function loadLibrary() { const response = await fetch("/api/owner/photo-library", { headers: { "x-wascik-owner-key": key() }, cache: "no-store" }); const data = await response.json().catch(() => ({})); if (response.ok) setPhotos(Array.isArray(data.photos) ? data.photos : []); }
  function resetEdit() { setEditedOwnerUrl(""); setEditCost(null); setLastValidation(null); setLastAttempts(0); }
  function selectPhoto(photo: SavedPhoto) { setOwnerUrl(photo.url); setOwnerName(`${photo.category} · ${photo.label}`); setEditedOwnerUrl(""); setLastValidation(null); setLibraryOpen(false); setNotice(`${photo.label} selected for this ad.`); }
  async function upload(event: ChangeEvent<HTMLInputElement>) { const files = Array.from(event.target.files || []); event.target.value = ""; if (!files.length) return; setUploading(true); setError(""); try { for (const file of files) { const form = new FormData(); form.append("file", file); form.append("label", file.name.replace(/\.[^.]+$/, "")); form.append("category", photoCategory); const response = await fetch("/api/owner/photo-library", { method: "POST", headers: { "x-wascik-owner-key": key() }, body: form }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Photo upload failed."); } await loadLibrary(); setLibraryOpen(true); setNotice("Photo saved to My Photos. Tap it to use it in this ad."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Photo upload failed."); } finally { setUploading(false); } }

  function applyPlan(plan: DirectorPlan) {
    if (plan.creativeMode) setCreativeMode(plan.creativeMode);
    if (plan.identityLock) setIdentityLock(plan.identityLock);
    if (plan.heroPriority) setHeroPriority(plan.heroPriority);
    if (plan.gaze) setGaze(plan.gaze);
    if (plan.expression) setExpression(plan.expression);
    if (plan.interaction) setInteraction(plan.interaction);
    if (plan.refinement) setRefinement(plan.refinement);
    if (plan.style) setStyle(plan.style);
    if (plan.layout) setLayout(plan.layout);
    setDirectorPlan(plan);
    resetEdit();
  }

  async function askCreativeDirector(): Promise<DirectorPlan> {
    setPlanning(true); setError(""); setNotice("Creative Director is planning the ad…");
    try {
      const userPrompt = directorPrompt.trim() || HOUSE_DEFAULT_PROMPT;
      const response = await fetch("/api/owner/social-ads/creative-director", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() }, body: JSON.stringify({ merchant: product.merchant, product: product.title, category: product.category || "", platform, userPrompt, hasOwnerPhoto: Boolean(ownerUrl), hasProductImage: Boolean(product.image_url) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.plan) throw new Error(data.error || "The Creative Director could not plan this ad.");
      const plan = data.plan as DirectorPlan;
      applyPlan(plan);
      setNotice(plan.directorSummary || "Creative Director plan applied.");
      return plan;
    } finally { setPlanning(false); }
  }

  async function editOwnerIfNeeded(plan?: DirectorPlan | null): Promise<EditedScene | null> {
    const mode = plan?.creativeMode || creativeMode;
    if (!ownerUrl || mode === "product") return null;
    const response = await fetch("/api/owner/social-ads/owner-edit", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() }, body: JSON.stringify({ ownerPhotoUrl: ownerUrl, productImageUrl: product.image_url || "", merchant: product.merchant, product: product.title, category: product.category || "", gaze: plan?.gaze || gaze, expression: plan?.expression || expression, interaction: plan?.interaction || interaction, directions: [plan?.sceneBrief, ...(plan?.negativeConstraints || []).map((x) => `Do not: ${x}`), "Do not generate any readable text, slogans, badges, labels, signs, floating UI words, hologram words, captions, watermarks, or ad copy inside the photograph. The compositor adds all wording afterward.", directions, creativeNotes].filter(Boolean).join("\n"), creativeMode: mode, refinement: plan?.refinement || refinement, identityLock: plan?.identityLock || identityLock, heroPriority: plan?.heroPriority || heroPriority, quality: quality === "high" ? "medium" : "low", layout: plan?.layout || layout }) });
    const data = await response.json().catch(() => ({})) as EditResult;
    if (!response.ok || !data.imageDataUrl) { const reason = data.validation?.reasons?.[0]; setNotice(""); throw new Error([data.error || "The owner/product image could not be intelligently integrated.", reason].filter(Boolean).join(" ")); }
    if (product.image_url && (plan?.heroPriority || heroPriority) !== "owner" && !data.productReferenceIncluded) throw new Error("The exact product image was not included. The ad was stopped instead of accepting a bad result.");
    setEditedOwnerUrl(data.imageDataUrl); setModel(data.model || ""); const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null; setEditCost(cost); setBackgroundCost(null); if (cost && onImageCost) onImageCost(cost); const validation = data.validation || null; setLastValidation(validation); setLastAttempts(data.attemptsUsed || 1); return { url: data.imageDataUrl, productReferenceIncluded: Boolean(data.productReferenceIncluded), copyZone: data.recommendedCopyZone === "bottom" ? "bottom" : "top", attemptsUsed: data.attemptsUsed || 1, validation: validation || undefined };
  }

  function addCopyOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, copyZone: CopyZone = "top") {
    const margin = Math.round(width * .065); const textWidth = width - margin * 2;
    const topShade = ctx.createLinearGradient(0, 0, 0, height * .34); topShade.addColorStop(0, "rgba(0,0,0,.78)"); topShade.addColorStop(.58, "rgba(0,0,0,.36)"); topShade.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = topShade; ctx.fillRect(0, 0, width, height * .36);
    const bottomShade = ctx.createLinearGradient(0, height * .58, 0, height); bottomShade.addColorStop(0, "rgba(0,0,0,0)"); bottomShade.addColorStop(.48, "rgba(0,0,0,.40)"); bottomShade.addColorStop(1, "rgba(0,0,0,.84)"); ctx.fillStyle = bottomShade; ctx.fillRect(0, height * .56, width, height * .44);
    let headlineSize = Math.round(width * (layout === "story" ? .055 : .050)); ctx.font = `900 ${headlineSize}px system-ui,sans-serif`; let hookLines = wrap(ctx, hook, textWidth); while (hookLines.length > 2 && headlineSize > Math.round(width * .040)) { headlineSize -= 3; ctx.font = `900 ${headlineSize}px system-ui,sans-serif`; hookLines = wrap(ctx, hook, textWidth); }
    hookLines = hookLines.slice(0, 2); const hookGap = Math.round(headlineSize * 1.05); ctx.textAlign = "left";
    const brandY = copyZone === "top" ? Math.round(height * .050) : Math.round(height * .675);
    ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.font = `800 ${Math.round(width * .020)}px system-ui,sans-serif`; ctx.fillText(product.merchant.toUpperCase().slice(0, 40), margin, brandY);
    ctx.fillStyle = "#fff"; ctx.font = `900 ${headlineSize}px system-ui,sans-serif`; const hookY = brandY + Math.round(width * .060); hookLines.forEach((line, i) => ctx.fillText(line, margin, hookY + i * hookGap));
    if (support) { ctx.fillStyle = "rgba(255,255,255,.90)"; ctx.font = `600 ${Math.round(width * (copyZone === "top" ? .022 : .020))}px system-ui,sans-serif`; const supportLines = wrap(ctx, support, textWidth).slice(0, copyZone === "top" ? 2 : 1); const supportY = hookY + hookLines.length * hookGap + Math.round(width * .014); supportLines.forEach((line, i) => ctx.fillText(line, margin, supportY + i * Math.round(width * .030))); }
    const ctaW = width - margin * 2; const ctaH = Math.round(height * .058); const ctaY = Math.round(height * .890); ctx.fillStyle = "rgba(0,0,0,.80)"; roundRect(ctx, margin, ctaY, ctaW, ctaH, Math.round(ctaH * .14)); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.30)"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `900 ${Math.round(width * .028)}px system-ui,sans-serif`; ctx.fillText(button, width / 2, ctaY + Math.round(ctaH * .66));
    ctx.fillStyle = "rgba(255,255,255,.64)"; ctx.font = `700 ${Math.round(width * .014)}px system-ui,sans-serif`; ctx.fillText(product.merchant === "WASCIK App Development" ? "WASCIK App Development" : "WASCIK Affiliate Services", width / 2, height - Math.round(height * .014));
  }

  async function compose(bgUrl: string, editedScene: EditedScene | null) {
    const canvas = canvasRef.current; if (!canvas) return;
    const { width, height } = dims[layout]; canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d"); if (!ctx) return;
    if (editedScene?.url) { const scene = await loadImage(editedScene.url); cover(ctx, scene, 0, 0, width, height); }
    else { const bg = await loadImage(bgUrl); cover(ctx, bg, 0, 0, width, height); if (product.image_url) { const productImage = await loadImage(product.image_url); const safeTop = Math.round(height * .25); const safeBottom = Math.round(height * .79); const boxW = heroPriority === "product" ? Math.round(width * .84) : Math.round(width * .72); const boxH = safeBottom - safeTop; const boxX = Math.round((width - boxW) / 2); ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = Math.round(width * .025); ctx.fillStyle = "rgba(255,255,255,.08)"; roundRect(ctx, boxX, safeTop, boxW, boxH, Math.round(width * .025)); ctx.fill(); ctx.restore(); contain(ctx, productImage, boxX + 24, safeTop + 24, boxW - 48, boxH - 48); } }
    addCopyOverlay(ctx, width, height, editedScene?.copyZone || "top");
  }

  async function generate() {
    if (busy || planning) return;
    setBusy(true); setError(""); setNotice("Creative Director is preparing the ad…");
    try {
      const plan = await askCreativeDirector();
      const mode = plan?.creativeMode || creativeMode;
      const editedScene = ownerUrl && mode !== "product" ? await editOwnerIfNeeded(plan) : null;
      if (editedScene) { setBackground(editedScene.url); await compose(editedScene.url, editedScene); const v = editedScene.validation; setNotice(`Creative Director ad passed QC after ${editedScene.attemptsUsed} pass${editedScene.attemptsUsed === 1 ? "" : "es"} · identity ${v?.identityScore ?? "—"}/100 · product ${v?.productScore ?? "—"}/100 · hero ${v?.heroScore ?? "—"}/100.`); return; }
      const response = await fetch("/api/owner/social-ads/image", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() }, body: JSON.stringify({ merchant: product.merchant, product: product.title, category: product.category || "", platform, headline: plan?.visualHook || hook, creativeNotes: [creativeNotes, plan?.sceneBrief, ...(plan?.negativeConstraints || []).map((x) => `Do not: ${x}`), "Do not generate any readable text, slogans, labels, signs, badges, or UI words inside the image.", support ? `Visual support: ${support}` : "", `CTA: ${button}`, `Hero priority: ${plan?.heroPriority || heroPriority}`].filter(Boolean).join("\n"), quality, layout: plan?.layout || layout, style: plan?.style || style, creativeMode: mode, refinement: plan?.refinement || refinement }) });
      const data = await response.json().catch(() => ({})) as ImageResult; if (!response.ok || !data.imageDataUrl) throw new Error(data.error || "The ad environment could not be generated."); setBackground(data.imageDataUrl); setModel(data.model || ""); const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null; setBackgroundCost(cost); if (cost && onImageCost) onImageCost(cost); await compose(data.imageDataUrl, null); setNotice(`Creative Director product ad ready · ${profile.label}.`);
    } catch (reason) { setNotice(""); setError(reason instanceof Error ? reason.message : "The intelligent ad could not be generated."); }
    finally { setBusy(false); }
  }

  async function saveImage() { const canvas = canvasRef.current; if (!canvas || !background) return; const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1)); if (!blob) return; const file = new File([blob], `${product.merchant}-${product.title}-ad.png`.replace(/[^a-z0-9.-]+/gi, "-"), { type: "image/png" }); try { if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) { await navigator.share({ files: [file], title: `${product.title} ad` }); return; } } catch (reason) { if (reason instanceof DOMException && reason.name === "AbortError") return; } const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

  const field = { width: "100%", minWidth: 0, maxWidth: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.78)", color: "#eef8ff", padding: "10px 11px", fontSize: 15 } as const;
  const buttonStyle = { width: "100%", minWidth: 0, maxWidth: "100%", border: "1px solid rgba(113,220,255,.32)", borderRadius: 8, background: "rgba(113,220,255,.07)", color: "#71dcff", padding: "10px 11px", fontWeight: 800, cursor: "pointer", overflowWrap: "anywhere" as const };
  const label = { display: "grid", minWidth: 0, maxWidth: "100%", gap: 5, color: "#b7cad8", fontSize: 12 } as const;

  return <section className="photoAdV3" style={{ display: "grid", gap: 14, border: "1px solid rgba(113,220,255,.22)", borderRadius: 14, padding: 15, background: "rgba(113,220,255,.025)" }}>
    <div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>INTELLIGENT PHOTO AD · V5</div><h2 style={{ margin: "5px 0 0" }}>Simple Creative Director</h2><div style={{ marginTop: 6, color: "#9fb5c5", fontSize: 12 }}>Tell the AI what you want in plain English. Leave the box blank to use WASCIK house defaults.</div></div>

    <div style={{ border: "1px solid rgba(255,215,111,.28)", borderRadius: 12, padding: 12, background: "rgba(255,215,111,.035)", display: "grid", gap: 9 }}>
      <label style={label}><strong style={{ color: "#ffd76f" }}>Tell the AI what you want</strong><textarea value={directorPrompt} onChange={(e) => { setDirectorPrompt(e.target.value); setDirectorPlan(null); resetEdit(); }} rows={5} placeholder="Examples: Put these shoes on me and make them the hero. Make me look at the camera and smile. Put me naturally in this AquaCurve chair. Leave blank for the normal WASCIK style." style={{ ...field, resize: "vertical" }} /></label>
      <button type="button" disabled={busy || planning || (creativeMode !== "product" && !ownerUrl)} onClick={() => void generate()} style={{ width: "100%", border: 0, borderRadius: 8, padding: "14px 16px", fontWeight: 900, background: busy || planning ? "#314653" : "#71dcff", color: "#031019", fontSize: 16 }}>{busy || planning ? "AI is planning, generating, and checking the ad…" : "Generate Ad"}</button>
      {directorPlan?.directorSummary ? <div style={{ color: "#dcecf5", fontSize: 12, lineHeight: 1.45 }}><strong>Director plan:</strong> {directorPlan.directorSummary}</div> : null}
    </div>

    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}><div className="photoAdV3__libraryTop"><strong>My Photos</strong><button type="button" onClick={() => setLibraryOpen((v) => !v)} style={buttonStyle}>{libraryOpen ? "Close Library" : "Choose from My Photos"}</button></div>{ownerUrl ? <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0,1fr)", gap: 10, marginTop: 10, alignItems: "center" }}><img src={heroOwner} alt="Selected owner" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8 }} /><div style={{ minWidth: 0 }}><div style={{ color: "#8ff0b8", fontWeight: 800 }}>Selected for this ad</div><div style={{ fontSize: 11, color: "#9fb5c5", marginTop: 3 }}>{ownerName}</div><button type="button" onClick={() => { setOwnerUrl(""); setOwnerName(""); resetEdit(); }} style={{ ...buttonStyle, marginTop: 7, color: "#ffaaaa" }}>Remove</button></div></div> : null}{libraryOpen ? <div style={{ marginTop: 10, display: "grid", gap: 9 }}><div className="photoAdV3__libraryTop"><select value={photoCategory} onChange={(e) => setPhotoCategory(e.target.value)} style={field}>{categories.map((c) => <option key={c}>{c}</option>)}</select><label style={{ ...buttonStyle, display: "grid", placeItems: "center" }}>{uploading ? "Uploading…" : "Upload from Phone"}<input type="file" multiple accept="image/*" onChange={upload} style={{ display: "none" }} /></label></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100px,100%),1fr))", gap: 8, maxHeight: 320, overflowY: "auto" }}>{photos.map((p) => <button key={p.id} type="button" onClick={() => selectPhoto(p)} style={{ border: ownerUrl === p.url ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: 5, background: "rgba(255,255,255,.02)", color: "white", textAlign: "left" }}><img src={p.url} alt={p.label} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 5 }} /><div style={{ fontSize: 9, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</div></button>)}</div></div> : null}</div>

    <details style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 10, padding: 10, background: "rgba(255,255,255,.02)" }}>
      <summary style={{ cursor: "pointer", color: "#a9dff2", fontWeight: 900 }}>Advanced Overrides</summary>
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <div className="photoAdV3__grid"><label style={label}>Ad mode<select value={creativeMode} onChange={(e) => { setCreativeMode(e.target.value as CreativeMode); resetEdit(); }} style={field}><option value="product">Product Only</option><option value="composite">Product + Owner</option><option value="lifestyle">Lifestyle Integration</option></select></label><label style={label}>Quality<select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} style={field}><option value="low">Economy</option><option value="medium">Standard</option><option value="high">High</option></select></label><label style={label}>Size<select value={layout} onChange={(e) => setLayout(e.target.value as Layout)} style={field}>{Object.entries(dims).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label><label style={label}>Base style<select value={style} onChange={(e) => setStyle(e.target.value as Style)} style={field}><option value="clean-product">Clean Campaign</option><option value="social">Social</option><option value="reel-cover">Story / Reel</option><option value="flyer">Flyer</option></select></label></div>
        {creativeMode !== "product" ? <><div className="photoAdV3__grid"><label style={label}>Identity Lock<select value={identityLock} onChange={(e) => { setIdentityLock(e.target.value as IdentityLock); resetEdit(); }} style={field}><option value="strong">Strong · preserve me closely</option><option value="medium">Medium</option><option value="flexible">Flexible</option></select></label><label style={label}>Hero Priority<select value={heroPriority} onChange={(e) => { setHeroPriority(e.target.value as HeroPriority); resetEdit(); }} style={field}><option value="product">Product Hero</option><option value="shared">Shared Hero · product + me</option><option value="owner">Owner Hero</option></select></label></div><div className="photoAdV3__directionGrid"><label style={label}>Gaze<select value={gaze} onChange={(e) => { setGaze(e.target.value); resetEdit(); }} style={field}>{gazes.map((x) => <option key={x}>{x}</option>)}</select></label><label style={label}>Expression<select value={expression} onChange={(e) => { setExpression(e.target.value); resetEdit(); }} style={field}>{expressions.map((x) => <option key={x}>{x}</option>)}</select></label><label style={label}>Interaction<select value={interaction} onChange={(e) => { setInteraction(e.target.value); resetEdit(); }} style={field}>{interactions.map((x) => <option key={x}>{x}</option>)}</select></label></div><label style={label}>Extra directions<textarea value={directions} onChange={(e) => { setDirections(e.target.value); resetEdit(); }} rows={3} placeholder="Optional manual override." style={{ ...field, resize: "vertical" }} /></label></> : null}
        <div><strong style={{ color: "#b7cad8", fontSize: 12 }}>Creative refinement</strong><div className="photoAdV3__grid" style={{ marginTop: 8 }}>{(["premium", "bold", "minimal", "lifestyle", "balanced"] as Refinement[]).map((x) => <button key={x} type="button" onClick={() => { setRefinement(x); resetEdit(); }} style={{ ...buttonStyle, background: refinement === x ? "rgba(113,220,255,.18)" : buttonStyle.background }}>{x === "premium" ? "More Premium" : x === "bold" ? "More Bold" : x === "minimal" ? "More Minimal" : x === "lifestyle" ? "More Lifestyle" : "Balanced"}</button>)}</div></div>
      </div>
    </details>

    {error ? <div style={{ color: "#ff9f9f", fontSize: 12 }}>{error}</div> : null}{notice ? <div style={{ color: "#8ff0b8", fontSize: 12 }}>{notice}</div> : null}
    {lastValidation?.pass ? <div style={{ border: "1px solid rgba(143,240,184,.22)", borderRadius: 8, padding: 9, color: "#a9eec5", fontSize: 11 }}>QC passed · {lastAttempts} pass{lastAttempts === 1 ? "" : "es"} · identity {lastValidation.identityScore ?? "—"}/100 · product {lastValidation.productScore ?? "—"}/100 · interaction {lastValidation.interactionScore ?? "—"}/100 · hero {lastValidation.heroScore ?? "—"}/100</div> : null}
    <div className="photoAdV3__canvasWrap"><canvas ref={canvasRef} className="photoAdV3__canvas" style={{ display: background ? "block" : "none" }} /></div>
    {background ? <div className="photoAdV3__actions"><button type="button" onClick={() => void saveImage()} style={buttonStyle}>Save Image to iPhone / Photos</button><button type="button" onClick={() => void generate()} style={buttonStyle}>Regenerate</button></div> : null}
    {(backgroundCost != null || editCost != null) ? <div style={{ fontSize: 11, color: "#9fb5c5", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 9 }}>Model: {model || "image model"} · Product-only background: {backgroundCost != null ? `$${backgroundCost.toFixed(3)}` : "skipped for validated full scene"} · Validated owner/product scene: {editCost != null ? `$${editCost.toFixed(4)}` : "—"}</div> : null}
  </section>;
}
