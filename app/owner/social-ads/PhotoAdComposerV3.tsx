"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { resolveCreativeProfile } from "../../../lib/ai/socialAdCreativeProfile";
import "./photo-ad-composer-v3.css";

const SESSION_KEY = "wascik-owner-console-key";

type ProductForAd = { id: string; merchant: string; title: string; category?: string | null; image_url?: string | null };
type Props = {
  product: ProductForAd;
  platform: string;
  headline: string;
  cta: string;
  visualHook?: string;
  visualSupportLine?: string;
  visualCta?: string;
  creativeNotes?: string;
  onImageCost?: (cost: number) => void;
};
type Quality = "low" | "medium" | "high";
type Layout = "square" | "portrait" | "story";
type Style = "clean-product" | "social" | "reel-cover" | "flyer";
type CreativeMode = "product" | "composite" | "lifestyle";
type Refinement = "balanced" | "premium" | "bold" | "minimal" | "lifestyle";
type SavedPhoto = { id: string; label: string; category: string; url: string };
type ImageResult = { imageDataUrl?: string; model?: string; estimatedCostUsd?: number | null; error?: string };
type EditResult = ImageResult & { productReferenceIncluded?: boolean };
type EditedScene = { url: string; productReferenceIncluded: boolean };

const dims: Record<Layout, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: "Square · 1:1" },
  portrait: { width: 1080, height: 1350, label: "Portrait · 4:5" },
  story: { width: 1080, height: 1920, label: "Story / Reel · 9:16" },
};
const categories = ["General", "Business", "Welding", "Gaming", "Hunting", "Poolside", "Fashion", "Wellness / RevoMatic"];
const gazes = ["Look at viewer", "Look at product", "Look at screen / workspace", "Look off to the side", "Preserve original"];
const expressions = ["Friendly", "Confident", "Focused", "Serious", "Energetic", "Preserve original"];
const interactions = ["Preserve original pose", "Hold the product in my hand", "Put the tool in my hand", "Show me using the product", "Show me wearing the product", "Sit on / use the product naturally", "Stand beside the product", "Product displayed next to me"];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image(); image.crossOrigin = "anonymous"; image.onload = () => resolve(image); image.onerror = reject; image.src = src;
  });
}
function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight); const dw = image.naturalWidth * scale; const dh = image.naturalHeight * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function contain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight); const dw = image.naturalWidth * scale; const dh = image.naturalHeight * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius); ctx.arcTo(x + w, y + h, x, y + h, radius); ctx.arcTo(x, y + h, x, y, radius); ctx.arcTo(x, y, x + w, y, radius); ctx.closePath();
}
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.trim().split(/\s+/); const lines: string[] = []; let line = "";
  for (const word of words) { const test = line ? `${line} ${word}` : word; if (!line || ctx.measureText(test).width <= max) line = test; else { lines.push(line); line = word; } }
  if (line) lines.push(line); return lines;
}
function compact(text: string, max: number) { const s = text.trim().replace(/\s+/g, " "); return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`; }

export default function PhotoAdComposerV3({ product, platform, headline, cta, visualHook = "", visualSupportLine = "", visualCta = "", creativeNotes = "", onImageCost }: Props) {
  const profile = useMemo(() => resolveCreativeProfile(product.merchant, product.category || "", product.title), [product.merchant, product.category, product.title]);
  const [quality, setQuality] = useState<Quality>("medium");
  const [layout, setLayout] = useState<Layout>(platform === "TikTok" ? "story" : "portrait");
  const [style, setStyle] = useState<Style>("clean-product");
  const [creativeMode, setCreativeMode] = useState<CreativeMode>(profile.defaultMode);
  const [refinement, setRefinement] = useState<Refinement>("premium");
  const [background, setBackground] = useState("");
  const [ownerUrl, setOwnerUrl] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [editedOwnerUrl, setEditedOwnerUrl] = useState("");
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [photoCategory, setPhotoCategory] = useState("General");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gaze, setGaze] = useState("Look at viewer");
  const [expression, setExpression] = useState("Friendly");
  const [interaction, setInteraction] = useState("Preserve original pose");
  const [directions, setDirections] = useState("");
  const [model, setModel] = useState("");
  const [backgroundCost, setBackgroundCost] = useState<number | null>(null);
  const [editCost, setEditCost] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const heroOwner = editedOwnerUrl || ownerUrl;
  const hook = compact(visualHook || headline || product.title, 58);
  const support = compact(visualSupportLine || "", 84);
  const button = compact(visualCta || (cta.length < 28 ? cta : "Learn More"), 24);
  const key = () => sessionStorage.getItem(SESSION_KEY) || "";

  useEffect(() => { void loadLibrary(); }, []);
  useEffect(() => { setCreativeMode(profile.defaultMode); }, [profile.defaultMode]);

  async function loadLibrary() {
    const response = await fetch("/api/owner/photo-library", { headers: { "x-wascik-owner-key": key() }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setPhotos(Array.isArray(data.photos) ? data.photos : []);
  }
  function selectPhoto(photo: SavedPhoto) { setOwnerUrl(photo.url); setOwnerName(`${photo.category} · ${photo.label}`); setEditedOwnerUrl(""); setLibraryOpen(false); setNotice(`${photo.label} selected for this ad.`); }
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []); event.target.value = ""; if (!files.length) return;
    setUploading(true); setError("");
    try {
      for (const file of files) {
        const form = new FormData(); form.append("file", file); form.append("label", file.name.replace(/\.[^.]+$/, "")); form.append("category", photoCategory);
        const response = await fetch("/api/owner/photo-library", { method: "POST", headers: { "x-wascik-owner-key": key() }, body: form });
        const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Photo upload failed.");
      }
      await loadLibrary(); setLibraryOpen(true); setNotice("Photo saved to My Photos. Tap it to use it in this ad.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Photo upload failed."); }
    finally { setUploading(false); }
  }
  function resetEdit() { setEditedOwnerUrl(""); setEditCost(null); }

  async function editOwnerIfNeeded(): Promise<EditedScene | null> {
    if (!ownerUrl || creativeMode === "product") return null;
    const response = await fetch("/api/owner/social-ads/owner-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() },
      body: JSON.stringify({ ownerPhotoUrl: ownerUrl, productImageUrl: product.image_url || "", merchant: product.merchant, product: product.title, category: product.category || "", gaze, expression, interaction, directions, creativeMode, refinement, quality: quality === "high" ? "medium" : "low", layout }),
    });
    const data = await response.json().catch(() => ({})) as EditResult;
    if (!response.ok || !data.imageDataUrl) throw new Error(data.error || "The owner/product image could not be intelligently integrated.");
    setEditedOwnerUrl(data.imageDataUrl);
    const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null; setEditCost(cost); if (cost && onImageCost) onImageCost(cost);
    return { url: data.imageDataUrl, productReferenceIncluded: Boolean(data.productReferenceIncluded) };
  }

  function addCopyOverlay(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const margin = Math.round(width * .065); const top = Math.round(height * .052); const textWidth = width - margin * 2;
    const topShade = ctx.createLinearGradient(0, 0, 0, height * .38); topShade.addColorStop(0, "rgba(0,0,0,.78)"); topShade.addColorStop(.55, "rgba(0,0,0,.42)"); topShade.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = topShade; ctx.fillRect(0, 0, width, height * .40);
    const bottomShade = ctx.createLinearGradient(0, height * .68, 0, height); bottomShade.addColorStop(0, "rgba(0,0,0,0)"); bottomShade.addColorStop(.50, "rgba(0,0,0,.44)"); bottomShade.addColorStop(1, "rgba(0,0,0,.78)"); ctx.fillStyle = bottomShade; ctx.fillRect(0, height * .66, width, height * .34);
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.font = `800 ${Math.round(width * .020)}px system-ui,sans-serif`; ctx.fillText(product.merchant.toUpperCase().slice(0, 40), margin, top);
    let headlineSize = Math.round(width * (layout === "story" ? .055 : .050)); ctx.font = `900 ${headlineSize}px system-ui,sans-serif`; let hookLines = wrap(ctx, hook, textWidth);
    while (hookLines.length > 2 && headlineSize > Math.round(width * .040)) { headlineSize -= 3; ctx.font = `900 ${headlineSize}px system-ui,sans-serif`; hookLines = wrap(ctx, hook, textWidth); }
    hookLines = hookLines.slice(0, 2); const hookGap = Math.round(headlineSize * 1.05); const hookY = top + Math.round(width * .067); ctx.fillStyle = "#fff"; hookLines.forEach((line, i) => ctx.fillText(line, margin, hookY + i * hookGap));
    if (support) { ctx.fillStyle = "rgba(255,255,255,.86)"; ctx.font = `600 ${Math.round(width * .022)}px system-ui,sans-serif`; const supportLines = wrap(ctx, support, textWidth).slice(0, 2); const supportY = hookY + hookLines.length * hookGap + Math.round(width * .018); supportLines.forEach((line, i) => ctx.fillText(line, margin, supportY + i * Math.round(width * .030))); }
    const ctaW = width - margin * 2; const ctaH = Math.round(height * .058); const ctaY = Math.round(height * .835); ctx.fillStyle = "rgba(0,0,0,.70)"; roundRect(ctx, margin, ctaY, ctaW, ctaH, Math.round(ctaH * .18)); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `900 ${Math.round(width * .026)}px system-ui,sans-serif`; ctx.fillText(button, width / 2, ctaY + Math.round(ctaH * .66));
    ctx.fillStyle = "rgba(255,255,255,.60)"; ctx.font = `700 ${Math.round(width * .014)}px system-ui,sans-serif`; ctx.fillText(product.merchant === "WASCIK App Development" ? "WASCIK App Development" : "WASCIK Affiliate Services", width / 2, height - Math.round(height * .020));
  }

  async function compose(bgUrl: string, editedScene: EditedScene | null) {
    const canvas = canvasRef.current; if (!canvas) return;
    const { width, height } = dims[layout]; canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d"); if (!ctx) return;
    if (editedScene?.url) {
      const scene = await loadImage(editedScene.url); cover(ctx, scene, 0, 0, width, height);
    } else {
      const bg = await loadImage(bgUrl); cover(ctx, bg, 0, 0, width, height);
      if (product.image_url) {
        const productImage = await loadImage(product.image_url); const safeTop = Math.round(height * .27); const safeBottom = Math.round(height * .79); const boxW = Math.round(width * .72); const boxH = safeBottom - safeTop; const boxX = Math.round((width - boxW) / 2);
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = Math.round(width * .025); ctx.fillStyle = "rgba(255,255,255,.08)"; roundRect(ctx, boxX, safeTop, boxW, boxH, Math.round(width * .025)); ctx.fill(); ctx.restore(); contain(ctx, productImage, boxX + 28, safeTop + 28, boxW - 56, boxH - 56);
      }
    }
    addCopyOverlay(ctx, width, height);
  }

  async function generate() {
    if (busy) return; setBusy(true); setError(""); setNotice("Building one cohesive intelligent ad scene…");
    try {
      const editedScene = ownerUrl && creativeMode !== "product" ? await editOwnerIfNeeded() : null;
      const response = await fetch("/api/owner/social-ads/image", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() }, body: JSON.stringify({ merchant: product.merchant, product: product.title, category: product.category || "", platform, headline: hook, creativeNotes: [creativeNotes, support ? `Visual support: ${support}` : "", `CTA: ${button}`].filter(Boolean).join("\n"), quality, layout, style, creativeMode, refinement }) });
      const data = await response.json().catch(() => ({})) as ImageResult; if (!response.ok || !data.imageDataUrl) throw new Error(data.error || "The ad environment could not be generated.");
      setBackground(data.imageDataUrl); setModel(data.model || ""); const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null; setBackgroundCost(cost); if (cost && onImageCost) onImageCost(cost);
      await compose(data.imageDataUrl, editedScene); setNotice(`Ad ready · ${profile.label} · full-scene ${creativeMode === "lifestyle" ? "lifestyle integration" : creativeMode === "composite" ? "owner + product composition" : "product campaign"}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The intelligent ad could not be generated."); }
    finally { setBusy(false); }
  }

  function refine(next: Refinement) { setRefinement(next); resetEdit(); setNotice(`Refinement set to ${next}. Tap Generate Intelligent Photo Ad for a new version.`); }
  async function saveImage() {
    const canvas = canvasRef.current; if (!canvas || !background) return; const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1)); if (!blob) return;
    const file = new File([blob], `${product.merchant}-${product.title}-ad.png`.replace(/[^a-z0-9.-]+/gi, "-"), { type: "image/png" });
    try { if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) { await navigator.share({ files: [file], title: `${product.title} ad` }); return; } } catch (reason) { if (reason instanceof DOMException && reason.name === "AbortError") return; }
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const field = { width: "100%", minWidth: 0, maxWidth: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.78)", color: "#eef8ff", padding: "10px 11px", fontSize: 15 } as const;
  const buttonStyle = { width: "100%", minWidth: 0, maxWidth: "100%", border: "1px solid rgba(113,220,255,.32)", borderRadius: 8, background: "rgba(113,220,255,.07)", color: "#71dcff", padding: "10px 11px", fontWeight: 800, cursor: "pointer", overflowWrap: "anywhere" as const };
  const label = { display: "grid", minWidth: 0, maxWidth: "100%", gap: 5, color: "#b7cad8", fontSize: 12 } as const;

  return <section className="photoAdV3" style={{ display: "grid", gap: 14, border: "1px solid rgba(113,220,255,.22)", borderRadius: 14, padding: 15, background: "rgba(113,220,255,.025)" }}>
    <div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>INTELLIGENT PHOTO AD · V3</div><h2 style={{ margin: "5px 0 0" }}>Full-scene art director</h2><div style={{ marginTop: 6, color: "#9fb5c5", fontSize: 12 }}>Creative profile: <strong style={{ color: "#dcecf5" }}>{profile.label}</strong> · {profile.mood}</div></div>
    <div className="photoAdV3__grid"><label style={label}>Ad mode<select value={creativeMode} onChange={(e) => { setCreativeMode(e.target.value as CreativeMode); resetEdit(); }} style={field}><option value="product">Product Only</option><option value="composite">Product + Owner</option><option value="lifestyle">Lifestyle Integration</option></select></label><label style={label}>Quality<select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} style={field}><option value="low">Economy</option><option value="medium">Standard</option><option value="high">High</option></select></label><label style={label}>Size<select value={layout} onChange={(e) => setLayout(e.target.value as Layout)} style={field}>{Object.entries(dims).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label><label style={label}>Base style<select value={style} onChange={(e) => setStyle(e.target.value as Style)} style={field}><option value="clean-product">Clean Campaign</option><option value="social">Social</option><option value="reel-cover">Story / Reel</option><option value="flyer">Flyer</option></select></label></div>
    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}><div className="photoAdV3__libraryTop"><strong>My Photos</strong><button type="button" onClick={() => setLibraryOpen((v) => !v)} style={buttonStyle}>{libraryOpen ? "Close Library" : "Choose from My Photos"}</button></div>{ownerUrl ? <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0,1fr)", gap: 10, marginTop: 10, alignItems: "center" }}><img src={heroOwner} alt="Selected owner" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8 }} /><div style={{ minWidth: 0 }}><div style={{ color: "#8ff0b8", fontWeight: 800 }}>Selected for this ad</div><div style={{ fontSize: 11, color: "#9fb5c5", marginTop: 3, overflowWrap: "anywhere" }}>{ownerName}</div><button type="button" onClick={() => { setOwnerUrl(""); setOwnerName(""); resetEdit(); }} style={{ ...buttonStyle, marginTop: 7, color: "#ffaaaa" }}>Remove</button></div></div> : null}{libraryOpen ? <div style={{ marginTop: 10, display: "grid", gap: 9 }}><div className="photoAdV3__libraryTop"><select value={photoCategory} onChange={(e) => setPhotoCategory(e.target.value)} style={field}>{categories.map((c) => <option key={c}>{c}</option>)}</select><label style={{ ...buttonStyle, display: "grid", placeItems: "center" }}>{uploading ? "Uploading…" : "Upload from Phone"}<input type="file" multiple accept="image/*" onChange={upload} style={{ display: "none" }} /></label></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100px,100%),1fr))", gap: 8, maxHeight: 320, overflowY: "auto" }}>{photos.map((p) => <button key={p.id} type="button" onClick={() => selectPhoto(p)} style={{ border: ownerUrl === p.url ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: 5, background: "rgba(255,255,255,.02)", color: "white", textAlign: "left", minWidth: 0 }}><img src={p.url} alt={p.label} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 5 }} /><div style={{ fontSize: 9, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</div></button>)}</div></div> : null}</div>
    {creativeMode !== "product" ? <div style={{ display: "grid", gap: 9, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}><strong>Owner / Product Direction</strong><div className="photoAdV3__directionGrid"><label style={label}>Gaze<select value={gaze} onChange={(e) => { setGaze(e.target.value); resetEdit(); }} style={field}>{gazes.map((x) => <option key={x}>{x}</option>)}</select></label><label style={label}>Expression<select value={expression} onChange={(e) => { setExpression(e.target.value); resetEdit(); }} style={field}>{expressions.map((x) => <option key={x}>{x}</option>)}</select></label><label style={label}>Interaction<select value={interaction} onChange={(e) => { setInteraction(e.target.value); resetEdit(); }} style={field}>{interactions.map((x) => <option key={x}>{x}</option>)}</select></label></div><label style={label}>Specific directions<textarea value={directions} onChange={(e) => { setDirections(e.target.value); resetEdit(); }} rows={3} placeholder="Example: Seat me naturally in the AquaCurve chair, keep the poolside setting upscale, and make the whole image look like one professional campaign photo." style={{ ...field, resize: "vertical" }} /></label></div> : null}
    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}><strong>Creative refinement</strong><div className="photoAdV3__grid" style={{ marginTop: 8 }}>{(["premium", "bold", "minimal", "lifestyle", "balanced"] as Refinement[]).map((x) => <button key={x} type="button" onClick={() => refine(x)} style={{ ...buttonStyle, background: refinement === x ? "rgba(113,220,255,.18)" : buttonStyle.background }}>{x === "premium" ? "More Premium" : x === "bold" ? "More Bold" : x === "minimal" ? "More Minimal" : x === "lifestyle" ? "More Lifestyle" : "Balanced"}</button>)}</div></div>
    <button type="button" disabled={busy || (creativeMode !== "product" && !ownerUrl)} onClick={() => void generate()} style={{ width: "100%", minWidth: 0, border: 0, borderRadius: 8, padding: "14px 16px", fontWeight: 900, background: busy ? "#314653" : "#71dcff", color: "#031019", fontSize: 16, whiteSpace: "normal" }}>{busy ? "AI is art-directing one cohesive scene…" : "Generate Intelligent Photo Ad"}</button>
    {error ? <div style={{ color: "#ff9f9f", fontSize: 12, overflowWrap: "anywhere" }}>{error}</div> : null}{notice ? <div style={{ color: "#8ff0b8", fontSize: 12, overflowWrap: "anywhere" }}>{notice}</div> : null}
    <div className="photoAdV3__canvasWrap"><canvas ref={canvasRef} className="photoAdV3__canvas" style={{ display: background ? "block" : "none" }} /></div>
    {background ? <div className="photoAdV3__actions"><button type="button" onClick={() => void saveImage()} style={buttonStyle}>Save Image to iPhone / Photos</button><button type="button" onClick={() => void generate()} style={buttonStyle}>Regenerate Same Direction</button></div> : null}
    {(backgroundCost != null || editCost != null) ? <div style={{ fontSize: 11, color: "#9fb5c5", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 9, overflowWrap: "anywhere" }}>Model: {model || "image model"} · Background: {backgroundCost != null ? `$${backgroundCost.toFixed(3)}` : "—"} · Owner/product edit: {editCost != null ? `$${editCost.toFixed(4)}` : "—"}</div> : null}
  </section>;
}
