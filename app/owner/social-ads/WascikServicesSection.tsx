"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

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

type Assignment = { serviceId: string; photoId: string; label: string; category: string; url: string; updatedAt?: string };
type SavedPhoto = { id: string; label: string; category: string; url: string; originalName?: string };

type Props = {
  services: CatalogProduct[];
  opening: string;
  onStart: (item: CatalogProduct) => void | Promise<void>;
};

export default function WascikServicesSection({ services, opening, onStart }: Props) {
  const [assignments, setAssignments] = useState<Record<string, Assignment>>({});
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const holdTimer = useRef<number | null>(null);
  const heldRef = useRef(false);

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

  async function openPicker(service: CatalogProduct) {
    setEditing(service);
    setError("");
    setLoadingPhotos(true);
    try {
      const response = await fetch("/api/owner/photo-library", { headers: { "x-wascik-owner-key": ownerKey() }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load My Photos.");
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load My Photos.");
    } finally {
      setLoadingPhotos(false);
    }
  }

  function beginHold(service: CatalogProduct) {
    heldRef.current = false;
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      heldRef.current = true;
      void openPicker(service);
    }, 650);
  }

  function cancelHold() {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }

  function mediaTap(service: CatalogProduct) {
    cancelHold();
    if (heldRef.current) { heldRef.current = false; return; }
    void onStart(service);
  }

  async function assignPhoto(photo: SavedPhoto) {
    if (!editing || saving) return;
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/owner/wascik-service-media", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": ownerKey() },
        body: JSON.stringify({ serviceId: editing.id, photoId: photo.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not approve this service photo.");
      const assignment = data.assignment as Assignment;
      setAssignments((current) => ({ ...current, [editing.id]: assignment }));
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not approve this service photo.");
    } finally { setSaving(false); }
  }

  async function uploadAndAssign(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file || !editing || saving) return;
    setSaving(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("label", `${editing.title} Approved Media`);
      form.append("category", "Business");
      const uploadResponse = await fetch("/api/owner/photo-library", { method: "POST", headers: { "x-wascik-owner-key": ownerKey() }, body: form });
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadData.photo?.id) throw new Error(uploadData.error || "Could not upload this photo.");
      const assignResponse = await fetch("/api/owner/wascik-service-media", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": ownerKey() },
        body: JSON.stringify({ serviceId: editing.id, photoId: uploadData.photo.id }),
      });
      const assignData = await assignResponse.json().catch(() => ({}));
      if (!assignResponse.ok) throw new Error(assignData.error || "Photo uploaded, but could not be assigned to the service.");
      setAssignments((current) => ({ ...current, [editing.id]: assignData.assignment as Assignment }));
      setEditing(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not upload this approved service photo.");
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

  return <>
    <section style={{ border: "1px solid rgba(113,220,255,.28)", borderRadius: 17, padding: 15, background: "rgba(113,220,255,.035)" }}>
      <div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".13em" }}>WASCIK APP DEVELOPMENT</div><h2 style={{ margin: "5px 0 0" }}>My Products & Services</h2><p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.5 }}>Only owner-approved media is used. Tap a photo to build an ad. Press and hold the photo to replace it later.</p></div>
      {services.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, marginTop: 13 }}>
        {services.map((item) => {
          const media = assignments[item.id];
          return <article key={item.id} style={{ border: "1px solid rgba(113,220,255,.38)", borderRadius: 14, padding: 10, background: "linear-gradient(145deg,rgba(22,111,168,.18),rgba(255,255,255,.03))", color: "#eef8ff" }}>
            <button type="button" onPointerDown={() => beginHold(item)} onPointerUp={() => mediaTap(item)} onPointerCancel={cancelHold} onPointerLeave={cancelHold} onContextMenu={(event) => event.preventDefault()} disabled={Boolean(opening)} aria-label={`${item.title}. Tap to build an ad. Press and hold to replace approved photo.`} style={{ width: "100%", border: 0, padding: 0, background: "transparent", color: "inherit", cursor: opening ? "wait" : "pointer", textAlign: "left", touchAction: "manipulation" }}>
              {media?.url ? <img src={media.url} alt={`${item.title} approved WASCIK media`} style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", borderRadius: 10, display: "block", border: "1px solid rgba(113,220,255,.22)" }} /> : <div style={{ minHeight: 92, borderRadius: 10, border: "1px solid rgba(113,220,255,.18)", background: "radial-gradient(circle at 20% 20%,rgba(113,220,255,.18),rgba(3,12,21,.75))", display: "grid", placeItems: "center", color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".12em" }}>WASCIK APPROVED MEDIA</div>}
              <div style={{ marginTop: 8, color: "#71dcff", fontSize: 10, fontWeight: 900 }}>{item.category || "WASCIK SERVICE"}</div>
              <div style={{ marginTop: 5, fontSize: 15, fontWeight: 900 }}>{item.title}</div>
              <div style={{ marginTop: 5, color: "#9fb5c5", fontSize: 11 }}>{opening === item.id ? "Opening workspace…" : "Tap to build an ad →"}</div>
            </button>
            <button type="button" onClick={() => void openPicker(item)} style={{ width: "100%", marginTop: 8, border: "1px solid rgba(255,255,255,.12)", borderRadius: 9, background: "rgba(255,255,255,.035)", color: "#a9dff2", padding: "7px 8px", fontSize: 10, fontWeight: 850 }}>{media ? "Replace Approved Photo" : "Choose Approved Photo"}</button>
          </article>;
        })}
      </div> : <div style={{ marginTop: 12, color: "#91a8b7" }}>No WASCIK services loaded.</div>}
    </section>

    {editing ? <div role="dialog" aria-modal="true" aria-label={`Approved media for ${editing.title}`} onClick={() => !saving && setEditing(null)} style={{ position: "fixed", inset: 0, zIndex: 1300, display: "grid", placeItems: "center", padding: 16, background: "rgba(0,0,0,.78)" }}>
      <section onClick={(event) => event.stopPropagation()} style={{ width: "min(640px,100%)", maxHeight: "82vh", overflowY: "auto", borderRadius: 18, border: "1px solid rgba(113,220,255,.34)", background: "#07131d", padding: 16, color: "#eef8ff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}><div><div style={{ color: "#71dcff", fontSize: 11, fontWeight: 950 }}>WASCIK APPROVED MEDIA</div><h2 style={{ margin: "5px 0 0" }}>{editing.title}</h2><p style={{ margin: "6px 0 0", color: "#9fb5c5", fontSize: 13 }}>Choose an existing image from My Photos, or upload a new approved image from your phone.</p></div><button type="button" disabled={saving} onClick={() => setEditing(null)} style={{ border: 0, background: "transparent", color: "#dcecf5", fontSize: 22 }}>×</button></div>
        <label style={{ display: "grid", placeItems: "center", marginTop: 14, border: "1px solid rgba(113,220,255,.32)", borderRadius: 11, padding: 11, color: "#71dcff", fontWeight: 900, cursor: saving ? "wait" : "pointer" }}>{saving ? "Saving…" : "Upload New Approved Photo"}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={saving} onChange={uploadAndAssign} style={{ display: "none" }} /></label>
        {error ? <div style={{ marginTop: 10, color: "#ff9f9f", fontSize: 12 }}>{error}</div> : null}
        {loadingPhotos ? <div style={{ marginTop: 14, color: "#71dcff" }}>Loading My Photos…</div> : null}
        {!loadingPhotos && photos.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(105px,1fr))", gap: 9, marginTop: 14 }}>{photos.map((photo) => <button key={photo.id} type="button" disabled={saving} onClick={() => void assignPhoto(photo)} style={{ border: assignments[editing.id]?.photoId === photo.id ? "2px solid #71dcff" : "1px solid rgba(255,255,255,.12)", borderRadius: 11, padding: 6, background: "rgba(255,255,255,.03)", color: "white", textAlign: "left" }}><img src={photo.url} alt={photo.label} style={{ width: "100%", aspectRatio: "4 / 5", objectFit: "cover", borderRadius: 7, display: "block" }} /><div style={{ marginTop: 5, fontSize: 10, fontWeight: 850, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.label}</div><div style={{ fontSize: 9, color: "#8fa6b6" }}>{photo.category}</div></button>)}</div> : null}
        {!loadingPhotos && !photos.length ? <div style={{ marginTop: 14, color: "#91a8b7", fontSize: 12 }}>My Photos is empty. Use “Upload New Approved Photo” above.</div> : null}
        {assignments[editing.id] ? <button type="button" disabled={saving} onClick={() => void removeAssignment()} style={{ width: "100%", marginTop: 14, border: "1px solid rgba(255,120,120,.25)", borderRadius: 10, background: "rgba(255,120,120,.05)", color: "#ffaaaa", padding: 9, fontWeight: 850 }}>Remove Approved Photo</button> : null}
      </section>
    </div> : null}
  </>;
}
