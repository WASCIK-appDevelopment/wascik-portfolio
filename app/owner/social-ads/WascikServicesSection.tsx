"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

const SESSION_KEY = "wascik-owner-console-key";
const CARD_WIDTH = 960;
const CARD_HEIGHT = 540;

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

type Assignment = { serviceId: string; photoId: string; label: string; category: string; url: string; updatedAt?: string };
type SavedPhoto = { id: string; label: string; category: string; url: string; originalName?: string };
type FitMode = "fit" | "crop";

type Props = {
  services: CatalogProduct[];
  opening: string;
  onStart: (item: CatalogProduct) => void | Promise<void>;
};

function drawPreview(canvas: HTMLCanvasElement, image: HTMLImageElement, mode: FitMode, zoom: number, offsetX: number, offsetY: number) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#07131d";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (!iw || !ih) return;
  const baseScale = mode === "fit" ? Math.min(CARD_WIDTH / iw, CARD_HEIGHT / ih) : Math.max(CARD_WIDTH / iw, CARD_HEIGHT / ih);
  const scale = baseScale * (mode === "fit" ? 1 : zoom);
  const dw = iw * scale;
  const dh = ih * scale;
  const overflowX = Math.max(0, dw - CARD_WIDTH);
  const overflowY = Math.max(0, dh - CARD_HEIGHT);
  const x = (CARD_WIDTH - dw) / 2 + (mode === "crop" ? offsetX * overflowX * 0.5 : 0);
  const y = (CARD_HEIGHT - dh) / 2 + (mode === "crop" ? offsetY * overflowY * 0.5 : 0);
  ctx.drawImage(image, x, y, dw, dh);
}

export default function WascikServicesSection({ services, opening, onStart }: Props) {
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fitPhoto, setFitPhoto] = useState<SavedPhoto | null>(null);
  const [fitSourceUrl, setFitSourceUrl] = useState("");
  const [fitMode, setFitMode] = useState<FitMode>("fit");
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const heldRef = useRef(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewImageRef = useRef<HTMLImageElement | null>(null);

  const ownerKey = () => sessionStorage.getItem(SESSION_KEY) || "";

  async function loadAssignments() {
    const response = await fetch("/api/owner/wascik-service-media", { headers: { "x-wascik-owner-key": ownerKey() }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return;
    const map: Record<string, Assignment> = {};
    for (const item of Array.isArray(data.assignments) ? data.assignments : []) map[item.serviceId] = item;
    setAssignments(map);
  }

  useEffect(() => { void loadAssignments(); }, []);
  useEffect(() => () => { if (fitSourceUrl.startsWith("blob:")) URL.revokeObjectURL(fitSourceUrl); }, [fitSourceUrl]);
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const image = previewImageRef.current;
    if (canvas && image && previewReady) drawPreview(canvas, image, fitMode, zoom, offsetX, offsetY);
  }, [fitMode, zoom, offsetX, offsetY, previewReady]);

  async function openPicker(service: CatalogProduct) {
    setEditing(service);
    setFitPhoto(null);
    setError("");
    setLoadingPhotos(true);
    try {
      const response = await fetch("/api/owner/photo-library", { headers: { "x-wascik-owner-key": ownerKey() }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load My Photos.");
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load My Photos.");
    } finally { setLoadingPhotos(false); }
  }

  function beginHold(service: CatalogProduct) {
    heldRef.current = false;
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => { heldRef.current = true; void openPicker(service); }, 650);
  }
  function cancelHold() { if (holdTimer.current) window.clearTimeout(holdTimer.current); holdTimer.current = null; }
  function mediaTap(service: CatalogProduct) { cancelHold(); if (heldRef.current) { heldRef.current = false; return; } void onStart(service); }

  async function beginFit(photo: SavedPhoto) {
    setError("");
    setPreviewReady(false);
    setFitMode("fit"); setZoom(1); setOffsetX(0); setOffsetY(0);
    try {
      const response = await fetch(photo.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load this photo for fitting.");
      const blob = await response.blob();
      if (fitSourceUrl.startsWith("blob:")) URL.revokeObjectURL(fitSourceUrl);
      const url = URL.createObjectURL(blob);
      setFitPhoto(photo);
      setFitSourceUrl(url);
      const image = new Image();
      image.onload = () => { previewImageRef.current = image; setPreviewReady(true); };
      image.onerror = () => setError("This image could not be opened in the fitting editor.");
      image.src = url;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not open the fitting editor.");
    }
  }

  async function uploadOriginalThenFit(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !editing || saving) return;
    setSaving(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("label", `${editing.title} Original`);
      form.append("category", "Business");
      const response = await fetch("/api/owner/photo-library", { method: "POST", headers: { "x-wascik-owner-key": ownerKey() }, body: form });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.photo?.id || !data.photo?.url) throw new Error(data.error || "Could not upload this photo.");
      const uploaded: SavedPhoto = { id: String(data.photo.id), label: String(data.photo.label || `${editing.title} Original`), category: String(data.photo.category || "Business"), url: String(data.photo.url), originalName: String(data.photo.original_name || file.name) };
      setPhotos((current) => [uploaded, ...current]);
      await beginFit(uploaded);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload this photo.");
    } finally { setSaving(false); }
  }

  async function saveFittedAndAssign() {
    if (!editing || !fitPhoto || !previewCanvasRef.current || saving) return;
    setSaving(true); setError("");
    try {
      const blob = await new Promise<Blob | null>((resolve) => previewCanvasRef.current?.toBlob(resolve, "image/png", 0.95));
      if (!blob) throw new Error("Could not create the fitted service image.");
      const file = new File([blob], `${editing.title.replace(/[^a-z0-9]+/gi, "-")}-service-card.png`, { type: "image/png" });
      const form = new FormData();
      form.append("file", file);
      form.append("label", `${editing.title} Service Card`);
      form.append("category", "Business");
      const uploadResponse = await fetch("/api/owner/photo-library", { method: "POST", headers: { "x-wascik-owner-key": ownerKey() }, body: form });
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadData.photo?.id) throw new Error(uploadData.error || "Could not save the fitted service image.");
      const assignResponse = await fetch("/api/owner/wascik-service-media", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": ownerKey() }, body: JSON.stringify({ serviceId: editing.id, photoId: uploadData.photo.id }) });
      const assignData = await assignResponse.json().catch(() => ({}));
      if (!assignResponse.ok) throw new Error(assignData.error || "The fitted image saved, but could not be assigned.");
      setAssignments((current) => ({ ...current, [editing.id]: assignData.assignment as Assignment }));
      setFitPhoto(null); setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the fitted service image.");
    } finally { setSaving(false); }
  }

  async function removeAssignment() {
    if (!editing || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/owner/wascik-service-media?serviceId=${encodeURIComponent(editing.id)}`, { method: "DELETE", headers: { "x-wascik-owner-key": ownerKey() } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not remove the approved photo.");
      setAssignments((current) => { const next = { ...current }; delete next[editing.id]; return next; });
      setEditing(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove the approved photo."); }
    finally { setSaving(false); }
  }

  const control = { border: "1px solid rgba(113,220,255,.30)", borderRadius: 9, background: "rgba(113,220,255,.06)", color: "#71dcff", padding: "9px 10px", fontWeight: 850, cursor: "pointer" } as const;

  return <>
    <section style={{ border: "1px solid rgba(113,220,255,.28)", borderRadius: 17, padding: 15, background: "rgba(113,220,255,.035)" }}>
      <div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".13em" }}>WASCIK APP DEVELOPMENT</div><h2 style={{ margin: "5px 0 0" }}>My Products & Services</h2><p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.5 }}>Only owner-approved media is used. Tap a photo to build an ad. Press and hold to replace it.</p></div>
      {services.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, marginTop: 13 }}>{services.map((item) => {
        const media = assignments[item.id];
        return <article key={item.id} style={{ border: "1px solid rgba(113,220,255,.38)", borderRadius: 14, padding: 10, background: "linear-gradient(145deg,rgba(22,111,168,.18),rgba(255,255,255,.03))", color: "#eef8ff" }}>
          <button type="button" onPointerDown={() => beginHold(item)} onPointerUp={() => mediaTap(item)} onPointerCancel={cancelHold} onPointerLeave={cancelHold} onContextMenu={(event) => event.preventDefault()} disabled={opening === item.id} style={{ width: "100%", border: 0, padding: 0, background: "transparent", color: "inherit", cursor: opening === item.id ? "wait" : "pointer", textAlign: "left", touchAction: "manipulation" }}>
            {media?.url ? <div style={{ width: "100%", aspectRatio: "16 / 9", overflow: "hidden", borderRadius: 10, border: "1px solid rgba(113,220,255,.22)", background: "#07131d" }}><img src={media.url} alt={`${item.title} approved WASCIK media`} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center", display: "block" }} /></div> : <div style={{ aspectRatio: "16 / 9", borderRadius: 10, border: "1px solid rgba(113,220,255,.18)", background: "radial-gradient(circle at 20% 20%,rgba(113,220,255,.18),rgba(3,12,21,.75))", display: "grid", placeItems: "center", color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".12em" }}>WASCIK APPROVED MEDIA</div>}
            <div style={{ marginTop: 8, color: "#71dcff", fontSize: 10, fontWeight: 900 }}>{item.category || "WASCIK SERVICE"}</div><div style={{ marginTop: 5, fontSize: 15, fontWeight: 900 }}>{item.title}</div><div style={{ marginTop: 5, color: "#9fb5c5", fontSize: 11 }}>{opening === item.id ? "Opening workspace…" : "Tap to build an ad →"}</div>
          </button>
          <button type="button" onClick={() => void openPicker(item)} style={{ width: "100%", marginTop: 8, ...control }}>{media ? "Replace Approved Photo" : "Choose Approved Photo"}</button>
        </article>;
      })}</div> : <div style={{ marginTop: 12, color: "#91a8b7" }}>No WASCIK services loaded.</div>}
    </section>

    {editing ? <div role="dialog" aria-modal="true" onClick={() => !saving && setEditing(null)} style={{ position: "fixed", inset: 0, zIndex: 1300, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.78)" }}><section onClick={(event) => event.stopPropagation()} style={{ width: "min(680px,100%)", maxHeight: "88vh", overflowY: "auto", borderRadius: 18, border: "1px solid rgba(113,220,255,.34)", background: "#07131d", padding: 16, color: "#eef8ff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 950 }}>WASCIK APPROVED MEDIA</div><h2 style={{ margin: "5px 0 0" }}>{editing.title}</h2></div><button type="button" disabled={saving} onClick={() => setEditing(null)} style={{ border: 0, background: "transparent", color: "#dcecf5", fontSize: 22 }}>×</button></div>
      {!fitPhoto ? <><p style={{ color: "#9fb5c5", fontSize: 13, lineHeight: 1.5 }}>Choose a photo first. Nothing is assigned until you preview exactly how it fits the service-card space.</p><label style={{ display: "grid", placeItems: "center", marginTop: 12, ...control }}>{saving ? "Uploading…" : "Upload New Photo from Phone"}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={saving} onChange={uploadOriginalThenFit} style={{ display: "none" }} /></label>{error ? <div style={{ marginTop: 10, color: "#ff9f9f", fontSize: 12 }}>{error}</div> : null}{loadingPhotos ? <div style={{ marginTop: 14, color: "#71dcff" }}>Loading My Photos…</div> : null}{!loadingPhotos && photos.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(105px,1fr))", gap: 9, marginTop: 14 }}>{photos.map((photo) => <button key={photo.id} type="button" disabled={saving} onClick={() => void beginFit(photo)} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 11, padding: 6, background: "rgba(255,255,255,.03)", color: "white", textAlign: "left" }}><div style={{ width: "100%", height: 112, overflow: "hidden", borderRadius: 7, background: "#07131d" }}><img src={photo.url} alt={photo.label} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} /></div><div style={{ marginTop: 5, fontSize: 10, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.label}</div></button>)}</div> : null}{assignments[editing.id] ? <button type="button" disabled={saving} onClick={() => void removeAssignment()} style={{ width: "100%", marginTop: 14, border: "1px solid rgba(255,120,120,.25)", borderRadius: 10, background: "rgba(255,120,120,.05)", color: "#ffaaaa", padding: 9, fontWeight: 850 }}>Remove Approved Photo</button> : null}</> : <><p style={{ color: "#9fb5c5", fontSize: 13, lineHeight: 1.5 }}>This is the exact 16:9 service-card space. Fit the whole photo or crop/reposition it before saving.</p><div style={{ borderRadius: 11, overflow: "hidden", border: "1px solid rgba(113,220,255,.34)", background: "#07131d" }}><canvas ref={previewCanvasRef} style={{ width: "100%", aspectRatio: "16 / 9", display: "block" }} /></div><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 12 }}><button type="button" onClick={() => { setFitMode("fit"); setZoom(1); setOffsetX(0); setOffsetY(0); }} style={{ ...control, background: fitMode === "fit" ? "rgba(113,220,255,.18)" : control.background }}>Fit Entire Photo</button><button type="button" onClick={() => setFitMode("crop")} style={{ ...control, background: fitMode === "crop" ? "rgba(113,220,255,.18)" : control.background }}>Crop to Fill</button></div>{fitMode === "crop" ? <div style={{ display: "grid", gap: 10, marginTop: 12 }}><label style={{ color: "#b7cad8", fontSize: 12 }}>Zoom · {zoom.toFixed(2)}×<input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ width: "100%" }} /></label><label style={{ color: "#b7cad8", fontSize: 12 }}>Move left / right<input type="range" min="-1" max="1" step="0.02" value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} style={{ width: "100%" }} /></label><label style={{ color: "#b7cad8", fontSize: 12 }}>Move up / down<input type="range" min="-1" max="1" step="0.02" value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} style={{ width: "100%" }} /></label></div> : <div style={{ marginTop: 10, color: "#8fa6b6", fontSize: 11 }}>Fit Entire Photo keeps every part visible. Empty space is preserved instead of cropping.</div>}{error ? <div style={{ marginTop: 10, color: "#ff9f9f", fontSize: 12 }}>{error}</div> : null}<div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 14 }}><button type="button" disabled={saving} onClick={() => setFitPhoto(null)} style={control}>Choose Different Photo</button><button type="button" disabled={saving || !previewReady} onClick={() => void saveFittedAndAssign()} style={{ ...control, background: "#71dcff", color: "#031019" }}>{saving ? "Saving…" : "Use This Fit for Service"}</button></div></>}
    </section></div> : null}
  </>;
}
