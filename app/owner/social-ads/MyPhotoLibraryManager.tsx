"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

const SESSION_KEY = "wascik-owner-console-key";
const categories = ["General", "Business", "Welding", "Gaming", "Hunting", "Poolside", "Fashion", "Wellness / RevoMatic"];

type SavedPhoto = {
  id: string;
  label: string;
  category: string;
  url: string;
  originalName?: string;
  fileSizeBytes?: number;
};

export default function MyPhotoLibraryManager() {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [category, setCategory] = useState("General");
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const ownerKey = () => sessionStorage.getItem(SESSION_KEY) || "";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/photo-library", {
        headers: { "x-wascik-owner-key": ownerKey() },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load My Photos.");
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load My Photos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("wascik-photo-library-updated", refresh);
    return () => window.removeEventListener("wascik-photo-library-updated", refresh);
  }, []);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length || uploading) return;
    setUploading(true);
    setNotice("");
    setError("");
    let count = 0;
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("label", file.name.replace(/\.[^.]+$/, ""));
        form.append("category", category);
        const response = await fetch("/api/owner/photo-library", {
          method: "POST",
          headers: { "x-wascik-owner-key": ownerKey() },
          body: form,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Could not upload ${file.name}.`);
        count += 1;
      }
      await load();
      window.dispatchEvent(new Event("wascik-photo-library-updated"));
      setNotice(`${count} photo${count === 1 ? "" : "s"} saved to My Photos.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(photo: SavedPhoto) {
    if (deletingId || !window.confirm(`Delete “${photo.label}” permanently from My Photos?`)) return;
    setDeletingId(photo.id);
    setNotice("");
    setError("");
    try {
      const response = await fetch(`/api/owner/photo-library?id=${encodeURIComponent(photo.id)}`, {
        method: "DELETE",
        headers: { "x-wascik-owner-key": ownerKey() },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not delete this photo.");
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      window.dispatchEvent(new Event("wascik-photo-library-updated"));
      setNotice(`${photo.label} deleted from My Photos.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this photo.");
    } finally {
      setDeletingId("");
    }
  }

  const control = { border: "1px solid rgba(113,220,255,.32)", borderRadius: 10, background: "rgba(113,220,255,.07)", color: "#71dcff", padding: "9px 11px", fontWeight: 900 } as const;

  return <section style={{ border: "1px solid rgba(113,220,255,.26)", borderRadius: 17, padding: 14, background: "rgba(113,220,255,.03)" }}>
    <button type="button" onClick={() => setOpen((value) => !value)} style={{ width: "100%", border: 0, background: "transparent", color: "#eef8ff", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, textAlign: "left", padding: 0 }}>
      <span><span style={{ display: "block", color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".12em" }}>MY PHOTOS</span><strong style={{ display: "block", marginTop: 4, fontSize: 18 }}>Owner photo library ({photos.length})</strong><span style={{ display: "block", marginTop: 4, color: "#91a8b7", fontSize: 12 }}>Upload once, reuse in ads, or delete photos you no longer want.</span></span>
      <span style={{ color: "#71dcff", fontSize: 20 }}>{open ? "⌃" : "⌄"}</span>
    </button>

    {open ? <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 9, alignItems: "end" }}>
        <label style={{ display: "grid", gap: 5, color: "#b7cad8", fontSize: 12 }}>Category<select value={category} onChange={(event) => setCategory(event.target.value)} style={{ width: "100%", borderRadius: 10, border: "1px solid rgba(255,255,255,.14)", background: "#07131d", color: "white", padding: "9px 10px", fontSize: 14 }}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label style={{ ...control, minHeight: 42, display: "grid", placeItems: "center", cursor: uploading ? "wait" : "pointer" }}>{uploading ? "Uploading…" : "Upload Photos"}<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={uploading} onChange={upload} style={{ display: "none" }} /></label>
      </div>
      <div style={{ color: "#819bab", fontSize: 11 }}>Select one or several photos from your iPhone. Maximum 10 MB each.</div>
      {loading ? <div style={{ color: "#71dcff" }}>Loading photos…</div> : null}
      {error ? <div style={{ color: "#ff9f9f", fontSize: 12 }}>{error}</div> : null}
      {notice ? <div style={{ color: "#8ff0b8", fontSize: 12 }}>{notice}</div> : null}
      {!loading && !photos.length ? <div style={{ border: "1px dashed rgba(255,255,255,.15)", borderRadius: 12, padding: 12, color: "#91a8b7", fontSize: 12 }}>No saved photos yet. Use Upload Photos above.</div> : null}
      {photos.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(135px,1fr))", gap: 10, maxHeight: 520, overflowY: "auto" }}>
        {photos.map((photo) => <article key={photo.id} style={{ border: "1px solid rgba(255,255,255,.11)", borderRadius: 13, padding: 7, background: "rgba(255,255,255,.025)" }}>
          <img src={photo.url} alt={photo.label} style={{ width: "100%", height: 150, objectFit: "cover", objectPosition: "center", borderRadius: 9, display: "block", background: "#06111b" }} />
          <div style={{ marginTop: 7, fontSize: 11, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{photo.label}</div>
          <div style={{ marginTop: 2, color: "#8fa6b6", fontSize: 10 }}>{photo.category}</div>
          <button type="button" disabled={Boolean(deletingId)} onClick={() => void remove(photo)} style={{ width: "100%", marginTop: 8, border: "1px solid rgba(255,110,110,.38)", borderRadius: 9, background: "rgba(255,90,90,.08)", color: "#ffaaaa", padding: "8px 7px", fontWeight: 900, fontSize: 11 }}>{deletingId === photo.id ? "Deleting…" : "Delete Photo"}</button>
        </article>)}
      </div> : null}
    </div> : null}
  </section>;
}
