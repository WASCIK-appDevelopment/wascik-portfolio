"use client";

import { useState } from "react";

const SESSION_KEY = "wascik-owner-console-key";

const destinations = [
  ["/affiliate-services", "Main Affiliate Services"],
  ["/affiliate-services/aquacurve", "AquaCurve"],
  ["/affiliate-services/eurooptic", "EuroOptic"],
  ["/affiliate-services/focus-camera", "Focus Camera"],
  ["/affiliate-services/gearup", "GearUP"],
  ["/affiliate-services/ticketnetwork", "TicketNetwork"],
] as const;

type ApprovedProduct = {
  id: string;
  merchant: string;
  title: string;
  category?: string | null;
  affiliate_url: string;
  image_url?: string | null;
  price?: string | null;
  page_path?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
};

function suggestedDestination(merchant: string) {
  const name = merchant.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name.includes("aquacurve")) return "/affiliate-services/aquacurve";
  if (name.includes("dhgate")) return "/affiliate-services";
  if (name.includes("eurooptic")) return "/affiliate-services/eurooptic";
  if (name.includes("focus")) return "/affiliate-services/focus-camera";
  if (name.includes("gearup")) return "/affiliate-services/gearup";
  if (name.includes("ticketnetwork")) return "/affiliate-services/ticketnetwork";
  return "/affiliate-services";
}

export default function ApprovedCatalogPublisher() {
  const [products, setProducts] = useState<ApprovedProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [view, setView] = useState<"ready" | "published" | "all">("ready");
  const [destinationById, setDestinationById] = useState<Record<string, string>>({});
  const [confirmationToken, setConfirmationToken] = useState("");
  const [confirmationSummary, setConfirmationSummary] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadProducts(show = true) {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/affiliate-search/approved", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load approved products.");
      const nextProducts = Array.isArray(data.products) ? data.products as ApprovedProduct[] : [];
      setProducts(nextProducts);
      setDestinationById(Object.fromEntries(nextProducts.map((item) => [item.id, item.page_path || suggestedDestination(item.merchant)])));
      if (show) setOpen(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load approved products.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    await loadProducts();
  }

  function toggleProduct(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setConfirmationToken("");
    setConfirmationSummary("");
    setNotice("");
  }

  function publications() {
    return selected.map((id) => ({ id, pagePath: destinationById[id] || "/affiliate-services" }));
  }

  const displayedProducts = products.filter((item) => view === "all" || (view === "published" ? Boolean(item.published_at) : !item.published_at));

  async function preparePublication() {
    if (!selected.length || loading) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/affiliate-search/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ action: "propose_publish", publications: publications() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not prepare publication.");
      setConfirmationToken(data.confirmationToken || "");
      setConfirmationSummary(data.summary || "Confirm publication.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not prepare publication.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPublication() {
    if (!confirmationToken || !selected.length || loading) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/owner/affiliate-search/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ action: "confirm_publish", confirmationToken, publications: publications() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not publish products.");
      setSelected([]);
      setConfirmationToken("");
      setConfirmationSummary("");
      setNotice(data.message || "Products published to their selected development pages.");
      await loadProducts(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not publish products.");
    } finally {
      setLoading(false);
    }
  }

  return <section style={{ padding: 15, borderRadius: 16, border: "1px solid rgba(105,214,255,.32)", background: "rgba(14,49,66,.2)" }}>
    <button type="button" onClick={toggleOpen} disabled={loading} style={{ width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid #65d8ff", background: "#123f53", color: "#d8f7ff", fontWeight: 900, opacity: loading ? .6 : 1 }}>{loading && !open ? "Loading approved products…" : open ? "Close Approved Products" : "View Approved Products"}</button>
    {error && <p style={{ margin: "10px 0 0", padding: 10, borderRadius: 10, background: "#3a1219", color: "#ffd7dc" }}>{error}</p>}
    {notice && <p style={{ margin: "10px 0 0", padding: 10, borderRadius: 10, background: "#102d22", color: "#bdf4cd" }}>{notice}</p>}
    {open && <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
      <div><h2 style={{ margin: 0 }}>Private Approved Products · {products.length}</h2><p style={{ margin: "5px 0 0", color: "#9fb8c5" }}>Select products, verify their destination pages, then prepare the yellow publication confirmation.</p></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {(["ready", "published", "all"] as const).map((option) => <button key={option} type="button" onClick={() => setView(option)} style={{ minHeight: 38, borderRadius: 999, border: view === option ? "1px solid #75e4ff" : "1px solid #49616d", background: view === option ? "#174e67" : "#101d24", color: "white", padding: "7px 12px", fontWeight: 900 }}>{option === "ready" ? "Ready to Publish" : option === "published" ? "Currently Published" : "All Approved"}</button>)}
        {selected.length > 0 && <button type="button" onClick={() => { setSelected([]); setConfirmationToken(""); setConfirmationSummary(""); }} style={{ minHeight: 38, borderRadius: 999, border: "1px solid #d1a94a", background: "#352b11", color: "#ffe7a3", padding: "7px 12px", fontWeight: 900 }}>Clear Selection</button>}
      </div>
      {displayedProducts.length === 0 ? <p style={{ margin: 0, color: "#9fb8c5" }}>{products.length === 0 ? "No approved products were found." : "No products are in this view."}</p> : displayedProducts.map((item) => {
        const active = selected.includes(item.id);
        return <article key={item.id} style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr)", gap: 11, padding: 10, borderRadius: 11, border: active ? "1px solid #6fe1ff" : "1px solid transparent", background: active ? "rgba(24,111,148,.2)" : "rgba(0,0,0,.24)" }}>
          {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 9, background: "white" }} /> : <div style={{ width: 64, height: 64, display: "grid", placeItems: "center", borderRadius: 9, background: "#18262e", color: "#7f9aa8", fontSize: 10, textAlign: "center" }}>No image</div>}
          <div style={{ display: "grid", gap: 7, minWidth: 0 }}><div><strong style={{ display: "block", lineHeight: 1.3 }}>{item.title}</strong><span style={{ display: "block", color: "#82cfe8", fontSize: 12, marginTop: 3 }}>{item.merchant}{item.category ? ` · ${item.category}` : ""}</span>{item.price && <span style={{ display: "block", color: "#8ff0b6", fontSize: 12, fontWeight: 900 }}>{item.price}</span>}{item.published_at && <span style={{ display: "block", color: "#ffd77e", fontSize: 11, marginTop: 2 }}>Currently published</span>}</div>
            <label style={{ display: "grid", gap: 4, fontSize: 12 }}><span>Destination page</span><select value={destinationById[item.id] || suggestedDestination(item.merchant)} onChange={(event) => { setDestinationById((current) => ({ ...current, [item.id]: event.target.value })); setConfirmationToken(""); }} style={{ minHeight: 40, borderRadius: 9, border: "1px solid rgba(255,255,255,.18)", background: "#07151d", color: "white", padding: "6px 8px", fontSize: 16 }}>{destinations.map(([path, label]) => <option key={path} value={path}>{label}</option>)}</select></label>
            <button type="button" onClick={() => toggleProduct(item.id)} style={{ minHeight: 40, borderRadius: 9, border: active ? "1px solid #7fe7ff" : "1px solid #5d7480", background: active ? "#175c78" : "#17232a", color: "white", fontWeight: 900 }}>{active ? "✓ Selected to publish" : "Select to publish"}</button>
          </div>
        </article>;
      })}
      {selected.length > 0 && !confirmationToken && <button type="button" onClick={preparePublication} disabled={loading} style={{ minHeight: 48, borderRadius: 12, border: "1px solid #ffd45c", background: "#725809", color: "white", fontWeight: 900, opacity: loading ? .6 : 1 }}>{loading ? "Preparing confirmation…" : `Review publication for ${selected.length} product${selected.length === 1 ? "" : "s"}`}</button>}
      {confirmationToken && <div style={{ padding: 14, borderRadius: 13, border: "2px solid #ffd45c", background: "#403200", color: "#fff4bd" }}><div style={{ fontSize: 12, fontWeight: 950, letterSpacing: ".12em" }}>CONFIRM PUBLICATION</div><p style={{ lineHeight: 1.5 }}>{confirmationSummary}</p><button type="button" onClick={confirmPublication} disabled={loading} style={{ width: "100%", minHeight: 48, borderRadius: 11, border: 0, background: "#ffd45c", color: "#201800", fontWeight: 950, opacity: loading ? .6 : 1 }}>{loading ? "Publishing…" : "Confirm and publish to development pages"}</button></div>}
    </div>}
  </section>;
}
