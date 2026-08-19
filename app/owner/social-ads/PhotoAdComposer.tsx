"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

const SESSION_KEY = "wascik-owner-console-key";

type ProductForAd = {
  id: string;
  merchant: string;
  title: string;
  category?: string | null;
  image_url?: string | null;
};

type Props = {
  product: ProductForAd;
  platform: string;
  headline: string;
  cta: string;
  creativeNotes?: string;
  onImageCost?: (cost: number) => void;
};

type Quality = "low" | "medium" | "high";
type Layout = "square" | "portrait" | "story";
type Style = "clean-product" | "social" | "reel-cover" | "flyer";

type ImageGenerationResult = {
  imageDataUrl?: string;
  model?: string;
  quality?: Quality;
  requestedLayout?: Layout;
  generatedSize?: string;
  estimatedCostUsd?: number | null;
};

const layoutDimensions: Record<Layout, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: "Square · 1:1" },
  portrait: { width: 1080, height: 1350, label: "Portrait · 4:5" },
  story: { width: 1080, height: 1920, label: "Story / Reel · 9:16" },
};

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
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawCoverInRect(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
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
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function PhotoAdComposer({ product, platform, headline, cta, creativeNotes = "", onImageCost }: Props) {
  const [quality, setQuality] = useState<Quality>("medium");
  const [layout, setLayout] = useState<Layout>(platform === "TikTok" ? "story" : "portrait");
  const [style, setStyle] = useState<Style>("clean-product");
  const [backgroundDataUrl, setBackgroundDataUrl] = useState("");
  const [ownerPhotoUrl, setOwnerPhotoUrl] = useState("");
  const [ownerPhotoName, setOwnerPhotoName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [imageCost, setImageCost] = useState<number | null>(null);
  const [model, setModel] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => { if (ownerPhotoUrl) URL.revokeObjectURL(ownerPhotoUrl); };
  }, [ownerPhotoUrl]);

  async function compose(background = backgroundDataUrl, owner = ownerPhotoUrl) {
    if (!background) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    setError("");
    try {
      const { width, height } = layoutDimensions[layout];
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not available.");

      const backgroundImage = await loadImage(background);
      drawCover(ctx, backgroundImage, width, height);

      const shade = ctx.createLinearGradient(0, 0, 0, height);
      shade.addColorStop(0, "rgba(2,9,19,.72)");
      shade.addColorStop(.38, "rgba(2,9,19,.15)");
      shade.addColorStop(1, "rgba(2,9,19,.78)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, width, height);

      const margin = Math.round(width * .07);
      const top = Math.round(height * .075);
      const productBoxY = Math.round(height * .38);
      const productBoxH = Math.round(height * (layout === "story" ? .38 : .36));
      const productBoxW = Math.round(width * (owner ? .59 : .78));
      const productBoxX = owner ? margin : Math.round((width - productBoxW) / 2);

      ctx.fillStyle = "rgba(255,255,255,.93)";
      roundedRect(ctx, productBoxX, productBoxY, productBoxW, productBoxH, 34);
      ctx.fill();

      if (product.image_url) {
        try {
          const productImage = await loadImage(product.image_url);
          drawContain(ctx, productImage, productBoxX + 28, productBoxY + 28, productBoxW - 56, productBoxH - 56);
        } catch {
          ctx.fillStyle = "#102537";
          ctx.font = `800 ${Math.round(width * .035)}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(product.title.slice(0, 50), productBoxX + productBoxW / 2, productBoxY + productBoxH / 2);
        }
      }

      if (owner) {
        try {
          const ownerImage = await loadImage(owner);
          const ownerX = Math.round(width * .70);
          const ownerY = productBoxY + Math.round(productBoxH * .08);
          const ownerW = Math.round(width * .24);
          const ownerH = Math.round(productBoxH * .84);
          ctx.save();
          roundedRect(ctx, ownerX, ownerY, ownerW, ownerH, 32);
          ctx.clip();
          drawCoverInRect(ctx, ownerImage, ownerX, ownerY, ownerW, ownerH);
          ctx.restore();
          ctx.strokeStyle = "rgba(255,215,111,.9)";
          ctx.lineWidth = 5;
          roundedRect(ctx, ownerX, ownerY, ownerW, ownerH, 32);
          ctx.stroke();
        } catch {}
      }

      ctx.textAlign = "left";
      ctx.fillStyle = "#71dcff";
      ctx.font = `900 ${Math.round(width * .032)}px system-ui, sans-serif`;
      ctx.fillText(product.merchant.toUpperCase().slice(0, 42), margin, top);

      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${Math.round(width * (layout === "story" ? .058 : .055))}px system-ui, sans-serif`;
      const headlineLines = wrapText(ctx, headline || product.title, width - margin * 2).slice(0, layout === "story" ? 4 : 3);
      const headlineGap = Math.round(width * .065);
      headlineLines.forEach((line, index) => ctx.fillText(line, margin, top + Math.round(width * .075) + index * headlineGap));

      const ctaText = (cta || "Learn more through WASCIK Affiliate Services").slice(0, 100);
      const buttonY = Math.round(height * .84);
      const buttonW = width - margin * 2;
      const buttonH = Math.round(height * (layout === "story" ? .07 : .085));
      ctx.fillStyle = "#f7d94c";
      roundedRect(ctx, margin, buttonY, buttonW, buttonH, 28);
      ctx.fill();
      ctx.fillStyle = "#07111d";
      ctx.textAlign = "center";
      ctx.font = `900 ${Math.round(width * .035)}px system-ui, sans-serif`;
      const ctaLines = wrapText(ctx, ctaText, buttonW - 60).slice(0, 2);
      ctaLines.forEach((line, index) => ctx.fillText(line, width / 2, buttonY + buttonH / 2 + 10 + index * Math.round(width * .042) - ((ctaLines.length - 1) * Math.round(width * .021))));

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.font = `700 ${Math.round(width * .018)}px system-ui, sans-serif`;
      ctx.fillText("Affiliate promotion · Pricing and availability may change", width / 2, height - Math.round(height * .035));
      setNotice("Photo ad is ready to preview and download.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The photo ad could not be composed.");
    } finally {
      setRendering(false);
    }
  }

  async function generatePhotoAd() {
    if (generating) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setGenerating(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/owner/social-ads/image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({
          merchant: product.merchant,
          product: product.title,
          category: product.category || "",
          platform,
          headline,
          creativeNotes,
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
      await compose(data.imageDataUrl, ownerPhotoUrl);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The AI photo ad could not be generated.");
    } finally {
      setGenerating(false);
    }
  }

  function ownerPhotoChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose a photo file for your picture.");
      return;
    }
    if (ownerPhotoUrl) URL.revokeObjectURL(ownerPhotoUrl);
    const url = URL.createObjectURL(file);
    setOwnerPhotoUrl(url);
    setOwnerPhotoName(file.name);
    if (backgroundDataUrl) void compose(backgroundDataUrl, url);
  }

  function removeOwnerPhoto() {
    if (ownerPhotoUrl) URL.revokeObjectURL(ownerPhotoUrl);
    setOwnerPhotoUrl("");
    setOwnerPhotoName("");
    if (backgroundDataUrl) void compose(backgroundDataUrl, "");
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundDataUrl) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const safe = `${product.merchant}-${product.title}-${platform}-photo-ad`.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 100);
      anchor.href = url;
      anchor.download = `${safe || "WASCIK-photo-ad"}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Photo ad downloaded to your phone as a PNG image.");
    }, "image/png", 1);
  }

  const fieldStyle = { width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,.14)", background: "rgba(3,10,18,.72)", color: "#eef8ff", padding: "11px 12px", fontSize: 15 } as const;
  const labelStyle = { display: "grid", gap: 6, color: "#b7cad8", fontSize: 13 } as const;

  return <section style={{ display: "grid", gap: 14, border: "1px solid rgba(113,220,255,.24)", borderRadius: 16, padding: 16, background: "rgba(113,220,255,.035)" }}>
    <div>
      <div style={{ color: "#71dcff", fontSize: 12, fontWeight: 900 }}>AI PHOTO AD GENERATOR</div>
      <h2 style={{ margin: "5px 0 0" }}>Create the downloadable picture ad</h2>
      <p style={{ margin: "7px 0 0", color: "#9fb5c5", lineHeight: 1.55 }}>AI creates the background. WASCIK then places the real published product image and exact ad wording on top, reducing the chance of the AI inventing the product. Your own photo can be added without another AI charge.</p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}>
      <label style={labelStyle}>Quality
        <select value={quality} onChange={(event) => setQuality(event.target.value as Quality)} style={fieldStyle}>
          <option value="low">Economy</option><option value="medium">Standard</option><option value="high">High</option>
        </select>
      </label>
      <label style={labelStyle}>Size
        <select value={layout} onChange={(event) => setLayout(event.target.value as Layout)} style={fieldStyle}>
          {Object.entries(layoutDimensions).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select>
      </label>
      <label style={labelStyle}>Style
        <select value={style} onChange={(event) => setStyle(event.target.value as Style)} style={fieldStyle}>
          <option value="clean-product">Clean product promo</option><option value="social">Social post</option><option value="reel-cover">Story / reel cover</option><option value="flyer">Flyer style</option>
        </select>
      </label>
    </div>

    <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 13, background: "rgba(255,255,255,.025)" }}>
      <strong>Optional: put your picture on the ad</strong>
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <label style={{ border: "1px solid rgba(113,220,255,.35)", borderRadius: 10, color: "#71dcff", padding: "9px 12px", cursor: "pointer", fontWeight: 850 }}>
          Choose My Photo<input type="file" accept="image/*" onChange={ownerPhotoChanged} style={{ display: "none" }} />
        </label>
        {ownerPhotoName ? <span style={{ color: "#dbe9f1", fontSize: 12 }}>{ownerPhotoName}</span> : <span style={{ color: "#8fa6b6", fontSize: 12 }}>You can add this later; product-only ads work now.</span>}
        {ownerPhotoUrl ? <button type="button" onClick={removeOwnerPhoto} style={{ border: 0, background: "transparent", color: "#ffaaaa", cursor: "pointer" }}>Remove photo</button> : null}
      </div>
    </div>

    <button type="button" onClick={() => void generatePhotoAd()} disabled={generating || rendering} style={{ border: 0, borderRadius: 12, padding: "13px 16px", fontWeight: 900, cursor: generating || rendering ? "not-allowed" : "pointer", background: generating || rendering ? "#314653" : "#71dcff", color: "#031019", fontSize: 16 }}>
      {generating ? "AI is generating the photo background…" : rendering ? "Building the final ad…" : "Generate Photo Ad"}
    </button>

    {error ? <div style={{ color: "#ff9f9f", fontSize: 13 }}>{error}</div> : null}
    {notice ? <div style={{ color: "#8ff0b8", fontSize: 13 }}>{notice}</div> : null}

    <canvas ref={canvasRef} style={{ width: "100%", display: backgroundDataUrl ? "block" : "none", borderRadius: 16, border: "1px solid rgba(255,255,255,.12)", background: "#06111b" }} />

    {backgroundDataUrl ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
      <button type="button" onClick={downloadPng} style={{ border: "1px solid rgba(113,220,255,.4)", borderRadius: 11, background: "rgba(113,220,255,.08)", color: "#71dcff", padding: "11px 12px", fontWeight: 900, cursor: "pointer" }}>Download Photo Ad to Phone</button>
      <button type="button" disabled style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 11, background: "rgba(255,255,255,.03)", color: "#718493", padding: "11px 12px", fontWeight: 850 }}>Video Generator · Future Premium</button>
    </div> : null}

    {backgroundDataUrl ? <div style={{ border: "1px solid rgba(255,215,111,.23)", borderRadius: 13, padding: 12, background: "rgba(255,215,111,.045)", color: "#dbe9f1", fontSize: 13 }}>
      <strong style={{ color: "#ffd76f" }}>Image generation cost</strong>
      <div style={{ marginTop: 6 }}>Model: {model || "image model"} · Quality: {quality} · Estimated image cost: {imageCost != null ? `$${imageCost.toFixed(3)}` : "shown in OpenAI account usage"}</div>
      {ownerPhotoUrl ? <div style={{ marginTop: 5, color: "#8ff0b8" }}>Adding your own photo to the final ad uses no additional OpenAI image generation.</div> : null}
    </div> : null}
  </section>;
}
