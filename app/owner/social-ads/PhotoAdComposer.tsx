"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

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
type SavedPhoto = { id: string; label: string; category: string; url: string; originalName?: string; fileSizeBytes?: number };
type ImageGenerationResult = { imageDataUrl?: string; model?: string; quality?: Quality; requestedLayout?: Layout; generatedSize?: string; estimatedCostUsd?: number | null };
type OwnerEditResult = { imageDataUrl?: string; model?: string; estimatedCostUsd?: number | null; productReferenceIncluded?: boolean; error?: string };

const layoutDimensions: Record<Layout, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: "Square · 1:1" },
  portrait: { width: 1080, height: 1350, label: "Portrait · 4:5" },
  story: { width: 1080, height: 1920, label: "Story / Reel · 9:16" },
};
const photoCategories = ["General", "Business", "Welding", "Gaming", "Hunting", "Poolside", "Fashion", "Wellness / RevoMatic"];
const gazeOptions = ["Look at viewer", "Look at product", "Look at screen / workspace", "Look off to the side", "Preserve original"];
const expressionOptions = ["Preserve original", "Friendly", "Confident", "Focused", "Serious", "Energetic"];
const interactionOptions = ["Preserve original pose", "Hold the product in my hand", "Put the tool in my hand", "Show me using the product", "Show me wearing the product", "Stand beside the product", "Product displayed next to me"];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image could not be loaded."));
    image.src = src;
  });
}
function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}
function drawCoverInRect(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}
function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !current) current = trial;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}
function compact(text: string, max: number) {
  const value = text.trim().replace(/\s+/g, " ");
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export default function PhotoAdComposer({ product, platform, headline, cta, visualHook = "", visualSupportLine = "", visualCta = "", creativeNotes = "", onImageCost }: Props) {
  const [quality, setQuality] = useState<Quality>("medium");
  const [layout, setLayout] = useState<Layout>(platform === "TikTok" ? "story" : "portrait");
  const [style, setStyle] = useState<Style>("clean-product");
  const [backgroundDataUrl, setBackgroundDataUrl] = useState("");
  const [ownerPhotoUrl, setOwnerPhotoUrl] = useState("");
  const [ownerPhotoName, setOwnerPhotoName] = useState("");
  const [ownerPhotoIsLocal, setOwnerPhotoIsLocal] = useState(false);
  const [ownerEditedUrl, setOwnerEditedUrl] = useState("");
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [photoCategory, setPhotoCategory] = useState("General");
  const [photoLibraryOpen, setPhotoLibraryOpen] = useState(true);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [imageCost, setImageCost] = useState<number | null>(null);
  const [ownerEditCost, setOwnerEditCost] = useState<number | null>(null);
  const [model, setModel] = useState("");
  const [gaze, setGaze] = useState("Look at viewer");
  const [expression, setExpression] = useState("Confident");
  const [interaction, setInteraction] = useState("Preserve original pose");
  const [specificDirections, setSpecificDirections] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoLibraryRef = useRef<HTMLDivElement | null>(null);

  const effectiveOwnerUrl = ownerEditedUrl || ownerPhotoUrl;
  const firstParty = product.merchant === "WASCIK App Development";
  const hook = compact(visualHook || headline || product.title, 70);
  const support = compact(visualSupportLine || "", 100);
  const buttonCopy = compact(visualCta || (cta.length <= 30 ? cta : (firstParty ? "Explore WASCIK" : "Learn More")), 32);

  useEffect(() => {
    void loadPhotoLibrary();
    const refresh = () => void loadPhotoLibrary();
    window.addEventListener("wascik-photo-library-updated", refresh);
    return () => {
      window.removeEventListener("wascik-photo-library-updated", refresh);
      if (ownerPhotoIsLocal && ownerPhotoUrl) URL.revokeObjectURL(ownerPhotoUrl);
    };
  }, []);

  async function loadPhotoLibrary() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    if (!key) return;
    setLibraryLoading(true);
    try {
      const response = await fetch("/api/owner/photo-library", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load My Photos.");
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load My Photos.");
    } finally {
      setLibraryLoading(false);
    }
  }

  function chooseFromLibrary() {
    setPhotoLibraryOpen(true);
    window.setTimeout(() => photoLibraryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
  }

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setUploading(true); setError(""); setNotice("");
    let uploaded = 0;
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("label", file.name.replace(/\.[^.]+$/, ""));
        form.append("category", photoCategory);
        const response = await fetch("/api/owner/photo-library", { method: "POST", headers: { "x-wascik-owner-key": key }, body: form });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Could not upload ${file.name}.`);
        uploaded += 1;
      }
      await loadPhotoLibrary();
      window.dispatchEvent(new Event("wascik-photo-library-updated"));
      setNotice(`${uploaded} photo${uploaded === 1 ? "" : "s"} saved permanently in My Photos.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function selectSavedPhoto(photo: SavedPhoto) {
    if (ownerPhotoIsLocal && ownerPhotoUrl) URL.revokeObjectURL(ownerPhotoUrl);
    setOwnerPhotoUrl(photo.url);
    setOwnerPhotoName(`${photo.category} · ${photo.label}`);
    setOwnerPhotoIsLocal(false);
    setOwnerEditedUrl("");
    setOwnerEditCost(null);
    setNotice(`${photo.label} selected for this ad.`);
    if (backgroundDataUrl) void compose(backgroundDataUrl, photo.url);
  }

  async function deleteSavedPhoto(photo: SavedPhoto) {
    if (!confirm(`Delete ${photo.label} permanently from My Photos?`)) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    const response = await fetch(`/api/owner/photo-library?id=${encodeURIComponent(photo.id)}`, { method: "DELETE", headers: { "x-wascik-owner-key": key } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Could not delete the photo."); return; }
    if (!ownerPhotoIsLocal && ownerPhotoUrl === photo.url) {
      setOwnerPhotoUrl(""); setOwnerPhotoName(""); setOwnerEditedUrl("");
      if (backgroundDataUrl) void compose(backgroundDataUrl, "");
    }
    await loadPhotoLibrary();
    window.dispatchEvent(new Event("wascik-photo-library-updated"));
    setNotice(`${photo.label} removed from My Photos.`);
  }

  function needsOwnerEdit() {
    return Boolean(ownerPhotoUrl && !ownerPhotoIsLocal && !ownerEditedUrl && (
      gaze !== "Preserve original" ||
      expression !== "Preserve original" ||
      interaction !== "Preserve original pose" ||
      specificDirections.trim()
    ));
  }

  async function requestOwnerEdit(showNotice = true): Promise<string> {
    if (!ownerPhotoUrl) return "";
    if (ownerPhotoIsLocal) throw new Error("Save this photo to My Photos first so AI can edit the pose, gaze, or product interaction.");
    if (ownerEditedUrl) return ownerEditedUrl;
    setEditingOwner(true); setError("");
    try {
      const key = sessionStorage.getItem(SESSION_KEY) || "";
      const response = await fetch("/api/owner/social-ads/owner-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({
          ownerPhotoUrl,
          productImageUrl: product.image_url || "",
          merchant: product.merchant,
          product: product.title,
          gaze,
          expression,
          interaction,
          directions: specificDirections,
          quality: quality === "high" ? "medium" : "low",
          layout,
        }),
      });
      const data = await response.json().catch(() => ({})) as OwnerEditResult;
      if (!response.ok || !data.imageDataUrl) throw new Error(data.error || "Could not apply your photo directions.");
      setOwnerEditedUrl(data.imageDataUrl);
      const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null;
      setOwnerEditCost(cost);
      if (cost && cost > 0) onImageCost?.(cost);
      if (backgroundDataUrl) await compose(backgroundDataUrl, data.imageDataUrl);
      if (showNotice) setNotice(data.productReferenceIncluded ? "AI directions applied using your photo and the product reference." : "AI directions applied to your photo.");
      return data.imageDataUrl;
    } finally {
      setEditingOwner(false);
    }
  }

  async function applyOwnerDirections() {
    try {
      await requestOwnerEdit(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not apply your photo directions.");
    }
  }

  async function compose(background = backgroundDataUrl, owner = effectiveOwnerUrl) {
    if (!background) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true); setError("");
    try {
      const { width, height } = layoutDimensions[layout];
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available.");

      const bg = await loadImage(background);
      drawCover(ctx, bg, width, height);
      const shade = ctx.createLinearGradient(0, 0, 0, height);
      shade.addColorStop(0, "rgba(2,9,19,.78)");
      shade.addColorStop(.34, "rgba(2,9,19,.22)");
      shade.addColorStop(1, "rgba(2,9,19,.84)");
      ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);

      const margin = Math.round(width * .07);
      const top = Math.round(height * .065);
      ctx.textAlign = "left";
      ctx.fillStyle = "#71dcff";
      ctx.font = `900 ${Math.round(width * .026)}px system-ui,sans-serif`;
      ctx.fillText(product.merchant.toUpperCase().slice(0, 42), margin, top);

      ctx.fillStyle = "#fff";
      ctx.font = `900 ${Math.round(width * (layout === "story" ? .064 : .058))}px system-ui,sans-serif`;
      const hookLines = wrapText(ctx, hook, width - margin * 2).slice(0, layout === "story" ? 3 : 2);
      const hookGap = Math.round(width * .068);
      hookLines.forEach((line, i) => ctx.fillText(line, margin, top + Math.round(width * .075) + i * hookGap));

      let supportBottom = top + Math.round(width * .09) + hookLines.length * hookGap;
      if (support) {
        ctx.fillStyle = "rgba(255,255,255,.88)";
        ctx.font = `650 ${Math.round(width * .026)}px system-ui,sans-serif`;
        const supportLines = wrapText(ctx, support, width - margin * 2).slice(0, 2);
        supportLines.forEach((line, i) => ctx.fillText(line, margin, supportBottom + i * Math.round(width * .034)));
        supportBottom += supportLines.length * Math.round(width * .034);
      }

      const heroY = Math.max(Math.round(height * .32), supportBottom + Math.round(height * .025));
      const heroBottom = Math.round(height * .79);
      const heroH = Math.max(220, heroBottom - heroY);
      const heroW = width - margin * 2;
      const hasProduct = Boolean(product.image_url);
      const hasOwner = Boolean(owner);

      if (hasProduct && hasOwner) {
        const gap = Math.round(width * .025);
        const productW = Math.round(heroW * .60);
        const ownerW = heroW - productW - gap;
        ctx.fillStyle = "rgba(255,255,255,.95)";
        roundedRect(ctx, margin, heroY, productW, heroH, 34); ctx.fill();
        try {
          const productImage = await loadImage(product.image_url!);
          drawContain(ctx, productImage, margin + 28, heroY + 28, productW - 56, heroH - 56);
        } catch {}
        try {
          const ownerImage = await loadImage(owner);
          const ownerX = margin + productW + gap;
          ctx.save(); roundedRect(ctx, ownerX, heroY, ownerW, heroH, 34); ctx.clip(); drawCoverInRect(ctx, ownerImage, ownerX, heroY, ownerW, heroH); ctx.restore();
          ctx.strokeStyle = "rgba(255,215,111,.9)"; ctx.lineWidth = 5; roundedRect(ctx, ownerX, heroY, ownerW, heroH, 34); ctx.stroke();
        } catch {}
      } else if (hasOwner) {
        try {
          const ownerImage = await loadImage(owner);
          ctx.save(); roundedRect(ctx, margin, heroY, heroW, heroH, 38); ctx.clip(); drawCoverInRect(ctx, ownerImage, margin, heroY, heroW, heroH); ctx.restore();
          const ownerShade = ctx.createLinearGradient(0, heroY, 0, heroY + heroH);
          ownerShade.addColorStop(0, "rgba(0,0,0,.02)"); ownerShade.addColorStop(1, "rgba(0,0,0,.28)");
          ctx.fillStyle = ownerShade; roundedRect(ctx, margin, heroY, heroW, heroH, 38); ctx.fill();
          ctx.strokeStyle = "rgba(113,220,255,.55)"; ctx.lineWidth = 4; roundedRect(ctx, margin, heroY, heroW, heroH, 38); ctx.stroke();
        } catch {}
      } else if (hasProduct) {
        ctx.fillStyle = "rgba(255,255,255,.95)";
        roundedRect(ctx, margin, heroY, heroW, heroH, 38); ctx.fill();
        try {
          const productImage = await loadImage(product.image_url!);
          drawContain(ctx, productImage, margin + 36, heroY + 36, heroW - 72, heroH - 72);
        } catch {}
      }

      const buttonY = Math.round(height * .835);
      const buttonW = width - margin * 2;
      const buttonH = Math.round(height * (layout === "story" ? .065 : .075));
      ctx.fillStyle = "#f7d94c";
      roundedRect(ctx, margin, buttonY, buttonW, buttonH, 28); ctx.fill();
      ctx.fillStyle = "#07111d";
      ctx.textAlign = "center";
      ctx.font = `900 ${Math.round(width * .034)}px system-ui,sans-serif`;
      ctx.fillText(buttonCopy || "Learn More", width / 2, buttonY + buttonH / 2 + Math.round(width * .012));

      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.font = `700 ${Math.round(width * .017)}px system-ui,sans-serif`;
      ctx.fillText(firstParty ? "WASCIK App Development" : "WASCIK Affiliate Services", width / 2, height - Math.round(height * .026));
      setNotice("Photo ad is ready. The layout adapted to the images that are actually available.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The photo ad could not be composed.");
    } finally {
      setRendering(false);
    }
  }

  async function generatePhotoAd() {
    if (generating || editingOwner) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setGenerating(true); setError(""); setNotice("");
    try {
      let ownerForAd = effectiveOwnerUrl;
      if (needsOwnerEdit()) {
        setNotice("First applying your gaze, expression, and product-interaction directions…");
        ownerForAd = await requestOwnerEdit(false);
      }
      const response = await fetch("/api/owner/social-ads/image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({
          merchant: product.merchant,
          product: product.title,
          category: product.category || "",
          platform,
          headline: hook,
          creativeNotes: [creativeNotes, support ? `Visual support line: ${support}` : "", `Visual CTA: ${buttonCopy}`].filter(Boolean).join("\n"),
          quality,
          layout,
          style,
        }),
      });
      const data = await response.json().catch(() => ({})) as ImageGenerationResult & { error?: string };
      if (!response.ok || !data.imageDataUrl) throw new Error(data.error || "The AI photo ad could not be generated.");
      setBackgroundDataUrl(data.imageDataUrl);
      setModel(data.model || "");
      const cost = typeof data.estimatedCostUsd === "number" ? data.estimatedCostUsd : null;
      setImageCost(cost);
      if (cost != null && cost > 0) onImageCost?.(cost);
      await compose(data.imageDataUrl, ownerForAd);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The AI photo ad could not be generated.");
    } finally {
      setGenerating(false);
    }
  }

  function temporaryPhotoChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose a photo file."); return; }
    if (ownerPhotoIsLocal && ownerPhotoUrl) URL.revokeObjectURL(ownerPhotoUrl);
    const url = URL.createObjectURL(file);
    setOwnerPhotoUrl(url);
    setOwnerPhotoName(`Temporary · ${file.name}`);
    setOwnerPhotoIsLocal(true);
    setOwnerEditedUrl("");
    if (backgroundDataUrl) void compose(backgroundDataUrl, url);
  }
  function removeOwnerPhoto() {
    if (ownerPhotoIsLocal && ownerPhotoUrl) URL.revokeObjectURL(ownerPhotoUrl);
    setOwnerPhotoUrl(""); setOwnerPhotoName(""); setOwnerPhotoIsLocal(false); setOwnerEditedUrl("");
    if (backgroundDataUrl) void compose(backgroundDataUrl, "");
  }

  async function saveImageToPhone() {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundDataUrl) return;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!blob) return;
    const safe = `${product.merchant}-${product.title}-${platform}-photo-ad`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 100) || "WASCIK-photo-ad";
    const file = new File([blob], `${safe}.png`, { type: "image/png" });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: `${product.title} ad` });
        setNotice("iPhone share sheet opened. Choose “Save Image” to put the ad in Photos.");
        return;
      }
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${safe}.png`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("This browser cannot send the image directly to the iPhone share sheet, so it downloaded the PNG to Files instead.");
  }

  const fieldStyle = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 15 } as const;
  const labelStyle = { display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 } as const;
  const smallButton = { border: "1px solid rgba(113,220,255,.35)", borderRadius: 10, background: "rgba(113,220,255,.08)", color: "#71dcff", padding: "9px 11px", cursor: "pointer", fontWeight: 850 } as const;

  return <section style={{ display: "grid", gap: 14, border: "1px solid rgba(113,220,255,.24)", borderRadius: 16, padding: 16, background: "rgba(113,220,255,.035)" }}>
    <div><div style={{ color: "#71dcff", fontSize: 12, fontWeight: 900 }}>AI PHOTO AD GENERATOR</div><h2 style={{ margin: "5px 0 0" }}>Create the downloadable picture ad</h2><p style={{ margin: "7px 0 0", color: "#9fb5c5", lineHeight: 1.55 }}>The generator now adapts the design to the assets you actually have. If there is no product image, your selected photo becomes the main visual instead of leaving an empty box.</p></div>

    <div ref={photoLibraryRef} style={{ border: "1px solid rgba(113,220,255,.24)", borderRadius: 14, padding: 13, background: "rgba(2,12,21,.62)" }}>
      <button type="button" onClick={() => setPhotoLibraryOpen(v => !v)} style={{ ...smallButton, width: "100%", textAlign: "left", display: "flex", justifyContent: "space-between" }}><span>MY PHOTOS · {photos.length} saved</span><span>{photoLibraryOpen ? "▲" : "▼"}</span></button>
      {photoLibraryOpen ? <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "end" }}><label style={labelStyle}>Category<select value={photoCategory} onChange={e => setPhotoCategory(e.target.value)} style={fieldStyle}>{photoCategories.map(x => <option key={x}>{x}</option>)}</select></label><label style={{ ...smallButton, minHeight: 44, display: "grid", placeItems: "center" }}>{uploading ? "Uploading…" : "Upload New Photos"}<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={uploading} onChange={uploadPhotos} style={{ display: "none" }} /></label></div>
        {libraryLoading ? <div style={{ color: "#71dcff" }}>Loading My Photos…</div> : null}
        {!libraryLoading && !photos.length ? <div style={{ color: "#9fb5c5", padding: 12, border: "1px dashed rgba(255,255,255,.15)", borderRadius: 12 }}>No saved photos yet.</div> : null}
        {photos.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 9, maxHeight: 380, overflowY: "auto" }}>{photos.map(photo => <div key={photo.id} style={{ border: ownerPhotoUrl === photo.url ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 6, background: ownerPhotoUrl === photo.url ? "rgba(113,220,255,.1)" : "rgba(255,255,255,.03)" }}><button type="button" onClick={() => selectSavedPhoto(photo)} style={{ width: "100%", border: 0, padding: 0, background: "transparent", color: "white", cursor: "pointer", textAlign: "left" }}><img src={photo.url} alt={photo.label} style={{ width: "100%", height: 130, objectFit: "cover", objectPosition: "center", borderRadius: 8, display: "block" }} /><div style={{ marginTop: 5, fontSize: 10, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.label}</div><div style={{ fontSize: 9, color: "#8fa6b6" }}>{photo.category}</div></button><button type="button" onClick={() => void deleteSavedPhoto(photo)} style={{ width: "100%", marginTop: 6, border: "1px solid rgba(255,110,110,.32)", borderRadius: 8, background: "rgba(255,90,90,.07)", color: "#ffaaaa", padding: "7px 5px", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>Delete Photo</button></div>)}</div> : null}
      </div> : null}
    </div>

    <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 13, padding: 11, background: "rgba(255,255,255,.025)" }}>
      <strong>Photo selected for this ad</strong>
      <div style={{ marginTop: 7, color: ownerPhotoName ? "#8ff0b8" : "#8fa6b6", fontSize: 12 }}>{ownerPhotoName || "None selected."}</div>
      {ownerEditedUrl ? <div style={{ marginTop: 5, color: "#ffd76f", fontSize: 11 }}>AI-directed version is active for this ad.</div> : null}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 8, marginTop: 10 }}>
        <button type="button" onClick={chooseFromLibrary} style={smallButton}>Choose from My Photos</button>
        <label style={{ ...smallButton, display: "grid", placeItems: "center" }}>Upload New Photo from Phone<input type="file" accept="image/*" onChange={temporaryPhotoChanged} style={{ display: "none" }} /></label>
        {effectiveOwnerUrl ? <button type="button" onClick={removeOwnerPhoto} style={{ ...smallButton, color: "#ffaaaa", borderColor: "rgba(255,120,120,.35)" }}>Remove from this ad</button> : null}
      </div>
    </div>

    <div style={{ border: "1px solid rgba(255,215,111,.24)", borderRadius: 14, padding: 13, background: "rgba(255,215,111,.04)", display: "grid", gap: 10 }}>
      <div><strong style={{ color: "#ffd76f" }}>Owner Photo Directions</strong><div style={{ marginTop: 4, color: "#9fb5c5", fontSize: 11 }}>These directions are now applied automatically when you generate the photo ad. The separate button remains only if you want to preview the edited owner image first.</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 9 }}>
        <label style={labelStyle}>Gaze / eye direction<select value={gaze} onChange={(event) => { setGaze(event.target.value); setOwnerEditedUrl(""); }} style={fieldStyle}>{gazeOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label style={labelStyle}>Expression<select value={expression} onChange={(event) => { setExpression(event.target.value); setOwnerEditedUrl(""); }} style={fieldStyle}>{expressionOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label style={labelStyle}>Product interaction<select value={interaction} onChange={(event) => { setInteraction(event.target.value); setOwnerEditedUrl(""); }} style={fieldStyle}>{interactionOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <label style={labelStyle}>Specific image directions<textarea value={specificDirections} onChange={(event) => { setSpecificDirections(event.target.value); setOwnerEditedUrl(""); }} rows={3} placeholder="Example: Keep me at the computer, make me smile and look directly at the viewer. Put the advertised tool in my right hand." style={{ ...fieldStyle, resize: "vertical" }} /></label>
      <button type="button" disabled={!ownerPhotoUrl || ownerPhotoIsLocal || editingOwner} onClick={() => void applyOwnerDirections()} style={{ ...smallButton, minHeight: 44, background: ownerPhotoUrl && !ownerPhotoIsLocal ? "rgba(255,215,111,.12)" : "rgba(255,255,255,.03)", color: ownerPhotoUrl && !ownerPhotoIsLocal ? "#ffd76f" : "#718493", borderColor: ownerPhotoUrl && !ownerPhotoIsLocal ? "rgba(255,215,111,.4)" : "rgba(255,255,255,.1)", cursor: ownerPhotoUrl && !ownerPhotoIsLocal ? "pointer" : "not-allowed" }}>{editingOwner ? "Applying AI directions…" : "Preview AI Photo Directions"}</button>
      {ownerEditCost != null ? <div style={{ color: "#dbe9f1", fontSize: 11 }}>Last owner-photo edit estimated cost: ${ownerEditCost.toFixed(4)}</div> : null}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}><label style={labelStyle}>Quality<select value={quality} onChange={e => setQuality(e.target.value as Quality)} style={fieldStyle}><option value="low">Economy</option><option value="medium">Standard</option><option value="high">High</option></select></label><label style={labelStyle}>Size<select value={layout} onChange={e => setLayout(e.target.value as Layout)} style={fieldStyle}>{Object.entries(layoutDimensions).map(([key,value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><label style={labelStyle}>Style<select value={style} onChange={e => setStyle(e.target.value as Style)} style={fieldStyle}><option value="clean-product">Clean product promo</option><option value="social">Social post</option><option value="reel-cover">Story / reel cover</option><option value="flyer">Flyer style</option></select></label></div>

    <button type="button" onClick={() => void generatePhotoAd()} disabled={generating || rendering || editingOwner} style={{ border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 900, cursor: generating || rendering || editingOwner ? "not-allowed" : "pointer", background: generating || rendering || editingOwner ? "#314653" : "#71dcff", color: "#031019", fontSize: 16 }}>{editingOwner ? "AI is editing your photo…" : generating ? "AI is creating your ad…" : rendering ? "Building the final design…" : "Generate Intelligent Photo Ad"}</button>
    {error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}{notice ? <div style={{ color: "#8ff0b8", fontSize: 13 }}>{notice}</div> : null}
    <canvas ref={canvasRef} style={{ width: "100%", display: backgroundDataUrl ? "block" : "none", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "#06111b" }} />
    {backgroundDataUrl ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}><button type="button" onClick={() => void saveImageToPhone()} style={{ ...smallButton, padding: "11px 12px" }}>Save Image to iPhone / Photos</button><button type="button" disabled style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 11, background: "rgba(255,255,255,.03)", color: "#718493", padding: "11px 12px", fontWeight: 850 }}>Video Generator · Future Premium</button></div> : null}
    {backgroundDataUrl ? <div style={{ border: "1px solid rgba(255,215,111,.23)", borderRadius: 13, padding: 12, background: "rgba(255,215,111,.045)", color: "#dbe9f1", fontSize: 13 }}><strong style={{ color: "#ffd76f" }}>Image generation cost</strong><div style={{ marginTop: 6 }}>Background model: {model || "image model"} · Quality: {quality} · Estimated background cost: {imageCost != null ? `$${imageCost.toFixed(3)}` : "shown in OpenAI account usage"}</div>{effectiveOwnerUrl ? <div style={{ marginTop: 5, color: "#8ff0b8" }}>{ownerEditedUrl ? "Your AI-directed owner photo is being used in the composition." : "Your selected owner photo is being used in the composition."}</div> : null}</div> : null}
  </section>;
}
