"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { resolveCreativeProfile } from "../../../lib/ai/socialAdCreativeProfile";

const SESSION_KEY = "wascik-owner-console-key";

type ProductForAd = { id: string; merchant: string; title: string; category?: string | null; image_url?: string | null };
type Props = {
  product: ProductForAd; platform: string; headline: string; cta: string;
  visualHook?: string; visualSupportLine?: string; visualCta?: string; creativeNotes?: string;
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

export default function PhotoAdComposerV2({ product, platform, headline, cta, visualHook = "", visualSupportLine = "", visualCta = "", creativeNotes = "", onImageCost }: Props) {
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
  const [integratedProduct, setIntegratedProduct] = useState(false);
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
  const hook = compact(visualHook || headline || product.title, 62);
  const support = compact(visualSupportLine || "", 88);
  const button = compact(visualCta || (cta.length < 28 ? cta : "Learn More"), 26);
  const key = () => sessionStorage.getItem(SESSION_KEY) || "";

  useEffect(() => { void loadLibrary(); }, []);
  useEffect(() => { setCreativeMode(profile.defaultMode); }, [profile.defaultMode]);

  async function loadLibrary() {
    const response = await fetch("/api/owner/photo-library", { headers: { "x-wascik-owner-key": key() }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok) setPhotos(Array.isArray(data.photos) ? data.photos : []);
  }
  function selectPhoto(photo: SavedPhoto) {
    setOwnerUrl(photo.url); setOwnerName(`${photo.category} · ${photo.label}`); setEditedOwnerUrl(""); setIntegratedProduct(false); setLibraryOpen(false); setNotice(`${photo.label} selected for this ad.`);
  }
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

  function resetEdit() { setEditedOwnerUrl(""); setIntegratedProduct(false); setEditCost(null); }

  async function editOwnerIfNeeded() {
    if (!ownerUrl || creativeMode === "product") return "";
    const response = await fetch("/api/owner/social-ads/owner-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() },
      body: JSON.stringify({ ownerPhotoUrl: ownerUrl, productImageUrl: product.image_url || "", merchant: product.merchant, product: product.title, category: product.category || "", gaze, expression, interaction, directions, creativeMode, refinement, quality: quality === "high" ? "medium" : "low", layout }),
    });
    const data = await response.json().catch(() => ({})) as EditResult;
    if (!response.ok || !data.imageDataUrl) throw new Error(data.error || "The owner/product image could not be intelligently integrated.");
    setEditedOwnerUrl(data.imageDataUrl); setIntegratedProduct(Boolean(data.productReferenceIncluded));
    const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null; setEditCost(cost); if (cost && onImageCost) onImageCost(cost);
    return data.imageDataUrl;
  }

  async function compose(bgUrl: string, personUrl: string, productAlreadyIntegrated: boolean) {
    const canvas = canvasRef.current; if (!canvas) return;
    const { width, height } = dims[layout]; canvas.width = width; canvas.height = height; const ctx = canvas.getContext("2d"); if (!ctx) return;
    const bg = await loadImage(bgUrl); cover(ctx, bg, 0, 0, width, height);
    const overlay = ctx.createLinearGradient(0, 0, 0, height); overlay.addColorStop(0, "rgba(0,0,0,.68)"); overlay.addColorStop(.30, "rgba(0,0,0,.08)"); overlay.addColorStop(1, "rgba(0,0,0,.72)"); ctx.fillStyle = overlay; ctx.fillRect(0, 0, width, height);

    const margin = Math.round(width * .07); const top = Math.round(height * .055); const textWidth = width - margin * 2;
    ctx.textAlign = "left"; ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.font = `700 ${Math.round(width * .021)}px system-ui,sans-serif`; ctx.fillText(product.merchant.toUpperCase().slice(0, 40), margin, top);
    ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(width * (layout === "story" ? .060 : .052))}px system-ui,sans-serif`; const hookLines = wrap(ctx, hook, textWidth).slice(0, 3); const hookGap = Math.round(width * .060); hookLines.forEach((line, i) => ctx.fillText(line, margin, top + Math.round(width * .070) + i * hookGap));
    let y = top + Math.round(width * .090) + hookLines.length * hookGap;
    if (support) { ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.font = `500 ${Math.round(width * .024)}px system-ui,sans-serif`; const lines = wrap(ctx, support, textWidth).slice(0, 2); lines.forEach((line, i) => ctx.fillText(line, margin, y + i * Math.round(width * .032))); y += lines.length * Math.round(width * .034); }

    const heroY = Math.max(Math.round(height * .29), y + Math.round(height * .02)); const heroBottom = Math.round(height * .79); const heroH = heroBottom - heroY; const heroW = width - margin * 2;
    const showProductSeparately = Boolean(product.image_url && !productAlreadyIntegrated && creativeMode !== "lifestyle");
    if (personUrl && (creativeMode === "lifestyle" || productAlreadyIntegrated || !showProductSeparately)) {
      const image = await loadImage(personUrl); ctx.save(); roundRect(ctx, margin, heroY, heroW, heroH, 12); ctx.clip(); cover(ctx, image, margin, heroY, heroW, heroH); ctx.restore();
    } else if (personUrl && showProductSeparately) {
      const owner = await loadImage(personUrl); const productImage = await loadImage(product.image_url!); const gap = Math.round(width * .025); const leftW = Math.round(heroW * .56); const rightW = heroW - leftW - gap;
      ctx.save(); roundRect(ctx, margin, heroY, leftW, heroH, 10); ctx.clip(); contain(ctx, productImage, margin + 18, heroY + 18, leftW - 36, heroH - 36); ctx.restore();
      ctx.save(); roundRect(ctx, margin + leftW + gap, heroY, rightW, heroH, 10); ctx.clip(); cover(ctx, owner, margin + leftW + gap, heroY, rightW, heroH); ctx.restore();
    } else if (product.image_url) {
      const image = await loadImage(product.image_url); ctx.fillStyle = "rgba(255,255,255,.94)"; ctx.fillRect(margin, heroY, heroW, heroH); contain(ctx, image, margin + 24, heroY + 24, heroW - 48, heroH - 48);
    }

    const ctaY = Math.round(height * .835); ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(margin, ctaY, width - margin * 2, Math.round(height * .055));
    ctx.fillStyle = "#fff"; ctx.font = `800 ${Math.round(width * .027)}px system-ui,sans-serif`; ctx.textAlign = "center"; ctx.fillText(button, width / 2, ctaY + Math.round(height * .036));
    ctx.fillStyle = "rgba(255,255,255,.58)"; ctx.font = `600 ${Math.round(width * .015)}px system-ui,sans-serif`; ctx.fillText(product.merchant === "WASCIK App Development" ? "WASCIK App Development" : "WASCIK Affiliate Services", width / 2, height - Math.round(height * .022));
  }

  async function generate() {
    if (busy) return; setBusy(true); setError(""); setNotice("Building an intelligent ad composition…");
    try {
      let person = ownerUrl; let integrated = false;
      if (ownerUrl && creativeMode !== "product") { person = await editOwnerIfNeeded(); integrated = Boolean(product.image_url); }
      const response = await fetch("/api/owner/social-ads/image", {
        method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key() },
        body: JSON.stringify({ merchant: product.merchant, product: product.title, category: product.category || "", platform, headline: hook, creativeNotes: [creativeNotes, support ? `Visual support: ${support}` : "", `CTA: ${button}`].filter(Boolean).join("\n"), quality, layout, style, creativeMode, refinement }),
      });
      const data = await response.json().catch(() => ({})) as ImageResult; if (!response.ok || !data.imageDataUrl) throw new Error(data.error || "The ad background could not be generated.");
      setBackground(data.imageDataUrl); setModel(data.model || ""); const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null; setBackgroundCost(cost); if (cost && onImageCost) onImageCost(cost);
      await compose(data.imageDataUrl, person, integrated && Boolean(person)); setNotice(`Ad ready · ${profile.label} · ${creativeMode === "lifestyle" ? "Lifestyle Integration" : creativeMode === "composite" ? "Product + Owner" : "Product Only"}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The intelligent ad could not be generated."); }
    finally { setBusy(false); }
  }

  async function refine(next: Refinement) { setRefinement(next); resetEdit(); setNotice(`Refinement set to ${next}. Tap Generate Intelligent Photo Ad to create a new version.`); }

  async function saveImage() {
    const canvas = canvasRef.current; if (!canvas || !background) return; const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1)); if (!blob) return;
    const file = new File([blob], `${product.merchant}-${product.title}-ad.png`.replace(/[^a-z0-9.-]+/gi, "-"), { type: "image/png" });
    try { if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) { await navigator.share({ files: [file], title: `${product.title} ad` }); return; } } catch (reason) { if (reason instanceof DOMException && reason.name === "AbortError") return; }
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const field = { width: "100%", borderRadius: 8, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.78)", color: "#eef8ff", padding: "10px 11px", fontSize: 15 } as const;
  const buttonStyle = { border: "1px solid rgba(113,220,255,.32)", borderRadius: 8, background: "rgba(113,220,255,.07)", color: "#71dcff", padding: "10px 11px", fontWeight: 800, cursor: "pointer" } as const;
  const label = { display: "grid", gap: 5, color: "#b7cad8", fontSize: 12 } as const;

  return <section style={{ display: "grid", gap: 14, border: "1px solid rgba(113,220,255,.22)", borderRadius: 14, padding: 15, background: "rgba(113,220,255,.025)" }}>
    <div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>INTELLIGENT PHOTO AD · V2</div><h2 style={{ margin: "5px 0 0" }}>Art-directed ad builder</h2><div style={{ marginTop: 6, color: "#9fb5c5", fontSize: 12 }}>Creative profile: <strong style={{ color: "#dcecf5" }}>{profile.label}</strong> · {profile.mood}</div></div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 9 }}>
      <label style={label}>Ad mode<select value={creativeMode} onChange={(e) => { setCreativeMode(e.target.value as CreativeMode); resetEdit(); }} style={field}><option value="product">Product Only</option><option value="composite">Product + Owner</option><option value="lifestyle">Lifestyle Integration</option></select></label>
      <label style={label}>Quality<select value={quality} onChange={(e) => setQuality(e.target.value as Quality)} style={field}><option value="low">Economy</option><option value="medium">Standard</option><option value="high">High</option></select></label>
      <label style={label}>Size<select value={layout} onChange={(e) => setLayout(e.target.value as Layout)} style={field}>{Object.entries(dims).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
      <label style={label}>Base style<select value={style} onChange={(e) => setStyle(e.target.value as Style)} style={field}><option value="clean-product">Clean Campaign</option><option value="social">Social</option><option value="reel-cover">Story / Reel</option><option value="flyer">Flyer</option></select></label>
    </div>

    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><strong>My Photos</strong><button type="button" onClick={() => setLibraryOpen((v) => !v)} style={buttonStyle}>{libraryOpen ? "Close Library" : "Choose from My Photos"}</button></div>
      {ownerUrl ? <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, marginTop: 10, alignItems: "center" }}><img src={heroOwner} alt="Selected owner" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8 }} /><div><div style={{ color: "#8ff0b8", fontWeight: 800 }}>Selected for this ad</div><div style={{ fontSize: 11, color: "#9fb5c5", marginTop: 3 }}>{ownerName}</div><button type="button" onClick={() => { setOwnerUrl(""); setOwnerName(""); resetEdit(); }} style={{ ...buttonStyle, marginTop: 7, color: "#ffaaaa" }}>Remove</button></div></div> : null}
      {libraryOpen ? <div style={{ marginTop: 10, display: "grid", gap: 9 }}><div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}><select value={photoCategory} onChange={(e) => setPhotoCategory(e.target.value)} style={field}>{categories.map((c) => <option key={c}>{c}</option>)}</select><label style={{ ...buttonStyle, display: "grid", placeItems: "center" }}>{uploading ? "Uploading…" : "Upload from Phone"}<input type="file" multiple accept="image/*" onChange={upload} style={{ display: "none" }} /></label></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 8, maxHeight: 320, overflowY: "auto" }}>{photos.map((p) => <button key={p.id} type="button" onClick={() => selectPhoto(p)} style={{ border: ownerUrl === p.url ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: 5, background: "rgba(255,255,255,.02)", color: "white", textAlign: "left" }}><img src={p.url} alt={p.label} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 5 }} /><div style={{ fontSize: 9, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.label}</div></button>)}</div></div> : null}
    </div>

    {creativeMode !== "product" ? <div style={{ display: "grid", gap: 9, borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}><strong>Owner / Product Direction</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}><label style={label}>Gaze<select value={gaze} onChange={(e) => { setGaze(e.target.value); resetEdit(); }} style={field}>{gazes.map((x) => <option key={x}>{x}</option>)}</select></label><label style={label}>Expression<select value={expression} onChange={(e) => { setExpression(e.target.value); resetEdit(); }} style={field}>{expressions.map((x) => <option key={x}>{x}</option>)}</select></label><label style={label}>Interaction<select value={interaction} onChange={(e) => { setInteraction(e.target.value); resetEdit(); }} style={field}>{interactions.map((x) => <option key={x}>{x}</option>)}</select></label></div><label style={label}>Specific directions<textarea value={directions} onChange={(e) => { setDirections(e.target.value); resetEdit(); }} rows={3} placeholder="Example: Seat me naturally in the AquaCurve chair, turn my face toward the viewer, and keep the poolside setting upscale and realistic." style={{ ...field, resize: "vertical" }} /></label></div> : null}

    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 12 }}><strong>Creative refinement</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 7, marginTop: 8 }}>{(["premium","bold","minimal","lifestyle","balanced"] as Refinement[]).map((x) => <button key={x} type="button" onClick={() => void refine(x)} style={{ ...buttonStyle, background: refinement === x ? "rgba(113,220,255,.18)" : buttonStyle.background }}>{x === "premium" ? "More Premium" : x === "bold" ? "More Bold" : x === "minimal" ? "More Minimal" : x === "lifestyle" ? "More Lifestyle" : "Balanced"}</button>)}</div></div>

    <button type="button" disabled={busy || (creativeMode !== "product" && !ownerUrl)} onClick={() => void generate()} style={{ border: 0, borderRadius: 8, padding: "14px 16px", fontWeight: 900, background: busy ? "#314653" : "#71dcff", color: "#031019", fontSize: 16 }}>{busy ? "AI is art-directing the ad…" : "Generate Intelligent Photo Ad"}</button>
    {error ? <div style={{ color: "#ff9f9f", fontSize: 12 }}>{error}</div> : null}{notice ? <div style={{ color: "#8ff0b8", fontSize: 12 }}>{notice}</div> : null}
    <canvas ref={canvasRef} style={{ width: "100%", display: background ? "block" : "none", borderRadius: 10, border: "1px solid rgba(255,255,255,.1)" }} />
    {background ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}><button type="button" onClick={() => void saveImage()} style={buttonStyle}>Save Image to iPhone / Photos</button><button type="button" onClick={() => void refine(refinement)} style={buttonStyle}>Regenerate Same Direction</button></div> : null}
    {(backgroundCost != null || editCost != null) ? <div style={{ fontSize: 11, color: "#9fb5c5", borderTop: "1px solid rgba(255,255,255,.08)", paddingTop: 9 }}>Model: {model || "image model"} · Background: {backgroundCost != null ? `$${backgroundCost.toFixed(3)}` : "—"} · Owner/product edit: {editCost != null ? `$${editCost.toFixed(4)}` : "—"}</div> : null}
  </section>;
}
