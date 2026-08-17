"use client";

import { useEffect, useState } from "react";

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
  catalog_source?: "builtin" | "console";
};

type ManagementAction = "unpublish" | "remove";

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

type Props = {
  mode?: "workspace" | "published";
};

export default function ApprovedCatalogPublisher({ mode = "workspace" }: Props) {
  const [products, setProducts] = useState<ApprovedProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [destinationById, setDestinationById] = useState<Record<string, string>>({});
  const [confirmationToken, setConfirmationToken] = useState("");
  const [confirmationSummary, setConfirmationSummary] = useState("");
  const [managementAction, setManagementAction] = useState<ManagementAction | null>(null);
  const [managementId, setManagementId] = useState("");
  const [managementToken, setManagementToken] = useState("");
  const [managementSummary, setManagementSummary] = useState("");
  const [managementLoadingId, setManagementLoadingId] = useState("");
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

  useEffect(() => {
    if (mode === "published") void loadProducts();
    // This runs once when the dedicated published-products page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function toggleProduct(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setConfirmationToken("");
    setConfirmationSummary("");
    setNotice("");
  }

  function publications() {
    return selected.map((id) => ({ id, pagePath: destinationById[id] || "/affiliate-services" }));
  }

  const displayedProducts = products.filter((item) => mode === "published" ? Boolean(item.published_at) : !item.published_at);

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

  async function prepareManagement(action: ManagementAction, item: ApprovedProduct) {
    if (loading || managementLoadingId) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setManagementLoadingId(item.id);
    setError("");
    setNotice("");
    try {
      const builtIn = item.catalog_source === "builtin";
      const response = await fetch(builtIn ? "/api/owner/affiliate-search/health" : "/api/owner/affiliate-search/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify(builtIn
          ? { action: "propose_remove", items: [{ id: item.id, merchant: item.merchant, title: item.title, reason: "Owner requested removal from Published Products", source: "builtin" }] }
          : { action: `propose_${action}`, ids: [item.id] }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Could not prepare ${action}.`);
      setManagementAction(action);
      setManagementId(item.id);
      setManagementToken(data.confirmationToken || "");
      setManagementSummary(`${item.title}\n\n${data.summary || "Confirm this change."}`);
      setConfirmationToken("");
      setConfirmationSummary("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Could not prepare ${action}.`);
    } finally {
      setManagementLoadingId("");
    }
  }

  async function confirmManagement() {
    if (!managementAction || !managementId || !managementToken || loading || managementLoadingId) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setManagementLoadingId(managementId);
    setError("");
    try {
      const item = products.find((product) => product.id === managementId);
      const builtIn = item?.catalog_source === "builtin";
      const response = await fetch(builtIn ? "/api/owner/affiliate-search/health" : "/api/owner/affiliate-search/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify(builtIn
          ? { action: "confirm_remove", items: [{ id: item?.id, merchant: item?.merchant, title: item?.title, reason: "Owner requested removal from Published Products", source: "builtin" }], confirmationToken: managementToken }
          : { action: `confirm_${managementAction}`, ids: [managementId], confirmationToken: managementToken }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Could not ${managementAction} product.`);
      setSelected((current) => current.filter((id) => id !== managementId));
      setManagementAction(null);
      setManagementId("");
      setManagementToken("");
      setManagementSummary("");
      setNotice(data.message || "Approved product updated.");
      await loadProducts(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Could not ${managementAction} product.`);
    } finally {
      setManagementLoadingId("");
    }
  }

  return <section style={{ padding: 15, borderRadius: 16, border: "1px solid rgba(105,214,255,.32)", background: "rgba(14,49,66,.2)" }}>
    {mode === "workspace" && <button type="button" onClick={toggleOpen} disabled={loading} style={{ width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid #65d8ff", background: "#123f53", color: "#d8f7ff", fontWeight: 900, opacity: loading ? .6 : 1 }}>{loading && !open ? "Loading ready products…" : open ? "Close Ready Products" : "View Ready Products"}</button>}
    {mode === "published" && loading && !open && <p style={{ margin: 0, color: "#9fb8c5" }}>Loading published products…</p>}
    {error && <p style={{ margin: "10px 0 0", padding: 10, borderRadius: 10, background: "#3a1219", color: "#ffd7dc" }}>{error}</p>}
    {notice && <p style={{ margin: "10px 0 0", padding: 10, borderRadius: 10, background: "#102d22", color: "#bdf4cd" }}>{notice}</p>}
    {open && <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
      <div><h2 style={{ margin: 0 }}>{mode === "published" ? "All Published Products" : "Ready to Publish"} · {displayedProducts.length}</h2><p style={{ margin: "5px 0 0", color: "#9fb8c5" }}>{mode === "published" ? "This combines products built into WASCIK pages with products published through the console. Every currently published item belongs here." : "Select products, verify their destination pages, then prepare the yellow publication confirmation. Published products automatically leave this workspace."}</p></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        <a href={mode === "published" ? "/owner/affiliate-search" : "/owner/published-products"} style={{ minHeight: 38, display: "grid", placeItems: "center", borderRadius: 999, border: "1px solid #75e4ff", background: "#174e67", color: "white", padding: "7px 12px", fontWeight: 900, textDecoration: "none" }}>{mode === "published" ? "← Back to Affiliate Search" : "Open Published Products →"}</a>
        {mode === "workspace" && selected.length > 0 && <button type="button" onClick={() => { setSelected([]); setConfirmationToken(""); setConfirmationSummary(""); }} style={{ minHeight: 38, borderRadius: 999, border: "1px solid #d1a94a", background: "#352b11", color: "#ffe7a3", padding: "7px 12px", fontWeight: 900 }}>Clear Selection</button>}
      </div>
      {displayedProducts.length === 0 ? <p style={{ margin: 0, color: "#9fb8c5" }}>{products.length === 0 ? "No approved products were found." : "No products are in this view."}</p> : displayedProducts.map((item) => {
        const active = selected.includes(item.id);
        return <article key={item.id} style={{ display: "grid", gridTemplateColumns: "64px minmax(0,1fr)", gap: 11, padding: 10, borderRadius: 11, border: active ? "1px solid #6fe1ff" : "1px solid transparent", background: active ? "rgba(24,111,148,.2)" : "rgba(0,0,0,.24)" }}>
          {item.image_url ? <img src={item.image_url} alt={item.title} style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 9, background: "white" }} /> : <div style={{ width: 64, height: 64, display: "grid", placeItems: "center", borderRadius: 9, background: "#18262e", color: "#7f9aa8", fontSize: 10, textAlign: "center" }}>No image</div>}
          <div style={{ display: "grid", gap: 7, minWidth: 0 }}><div><strong style={{ display: "block", lineHeight: 1.3 }}>{item.title}</strong><span style={{ display: "block", color: "#82cfe8", fontSize: 12, marginTop: 3 }}>{item.merchant}{item.category ? ` · ${item.category}` : ""}</span>{item.price && <span style={{ display: "block", color: "#8ff0b6", fontSize: 12, fontWeight: 900 }}>{item.price}</span>}{item.published_at && <span style={{ display: "block", color: "#ffd77e", fontSize: 11, marginTop: 2 }}>Currently published · {item.catalog_source === "builtin" ? "Original website catalog" : "Published through console"}</span>}</div>
            {mode === "workspace" && <label style={{ display: "grid", gap: 4, fontSize: 12 }}><span>Destination page</span><select value={destinationById[item.id] || suggestedDestination(item.merchant)} onChange={(event) => { setDestinationById((current) => ({ ...current, [item.id]: event.target.value })); setConfirmationToken(""); }} style={{ minHeight: 40, borderRadius: 9, border: "1px solid rgba(255,255,255,.18)", background: "#07151d", color: "white", padding: "6px 8px", fontSize: 16 }}>{destinations.map(([path, label]) => <option key={path} value={path}>{label}</option>)}</select></label>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6 }}>
              <a href={item.affiliate_url} target="_blank" rel="noopener noreferrer" style={{ minHeight: 40, display: "grid", placeItems: "center", borderRadius: 9, border: "1px solid #49b976", background: "#113523", color: "#c8f9d9", fontWeight: 900, textDecoration: "none", textAlign: "center", padding: 5 }}>Open affiliate link ↗</a>
              {mode === "published" && item.page_path ? <a href={item.page_path} target="_blank" rel="noopener noreferrer" style={{ minHeight: 40, display: "grid", placeItems: "center", borderRadius: 9, border: "1px solid #5d8de1", background: "#142b51", color: "#d8e6ff", fontWeight: 900, textDecoration: "none", textAlign: "center", padding: 5 }}>View public page ↗</a> : mode === "workspace" && <button type="button" onClick={() => toggleProduct(item.id)} style={{ minHeight: 40, borderRadius: 9, border: active ? "1px solid #7fe7ff" : "1px solid #5d7480", background: active ? "#175c78" : "#17232a", color: "white", fontWeight: 900 }}>{active ? "✓ Selected" : "Select to publish"}</button>}
              {mode === "published" && <button type="button" onClick={() => prepareManagement("unpublish", item)} disabled={loading || Boolean(managementLoadingId)} style={{ minHeight: 40, borderRadius: 9, border: "1px solid #d1a94a", background: "#352b11", color: "#ffe7a3", fontWeight: 900, opacity: managementLoadingId === item.id ? .6 : 1 }}>{item.catalog_source === "builtin" ? "Remove from publication" : "Unpublish"}</button>}
              {item.catalog_source !== "builtin" && <button type="button" onClick={() => prepareManagement("remove", item)} disabled={loading || Boolean(managementLoadingId)} style={{ minHeight: 40, borderRadius: 9, border: "1px solid #c85b68", background: "#3b151b", color: "#ffd9de", fontWeight: 900, opacity: managementLoadingId === item.id ? .6 : 1 }}>{mode === "published" ? "Delete from approved catalog" : "Remove from list"}</button>}
            </div>
            {managementToken && managementId === item.id && <div style={{ padding: 12, borderRadius: 11, border: "2px solid #ffd45c", background: "#403200", color: "#fff4bd" }}><div style={{ fontSize: 11, fontWeight: 950, letterSpacing: ".1em" }}>CONFIRM PRODUCT CHANGE</div><p style={{ lineHeight: 1.45, whiteSpace: "pre-line", margin: "8px 0" }}>{managementSummary}</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><button type="button" onClick={() => { setManagementAction(null); setManagementId(""); setManagementToken(""); setManagementSummary(""); }} style={{ minHeight: 44, borderRadius: 10, border: "1px solid #e2c96e", background: "transparent", color: "#fff4bd", fontWeight: 900 }}>Cancel</button><button type="button" onClick={confirmManagement} disabled={Boolean(managementLoadingId)} style={{ minHeight: 44, borderRadius: 10, border: 0, background: "#ffd45c", color: "#201800", fontWeight: 950, opacity: managementLoadingId === item.id ? .6 : 1 }}>{managementLoadingId === item.id ? "Applying…" : managementAction === "remove" ? "Confirm removal" : "Confirm unpublish"}</button></div></div>}
          </div>
        </article>;
      })}
      {mode === "workspace" && selected.length > 0 && !confirmationToken && <button type="button" onClick={preparePublication} disabled={loading} style={{ minHeight: 48, borderRadius: 12, border: "1px solid #ffd45c", background: "#725809", color: "white", fontWeight: 900, opacity: loading ? .6 : 1 }}>{loading ? "Preparing confirmation…" : `Review publication for ${selected.length} product${selected.length === 1 ? "" : "s"}`}</button>}
      {mode === "workspace" && confirmationToken && <div style={{ padding: 14, borderRadius: 13, border: "2px solid #ffd45c", background: "#403200", color: "#fff4bd" }}><div style={{ fontSize: 12, fontWeight: 950, letterSpacing: ".12em" }}>CONFIRM PUBLICATION</div><p style={{ lineHeight: 1.5 }}>{confirmationSummary}</p><button type="button" onClick={confirmPublication} disabled={loading} style={{ width: "100%", minHeight: 48, borderRadius: 11, border: 0, background: "#ffd45c", color: "#201800", fontWeight: 950, opacity: loading ? .6 : 1 }}>{loading ? "Publishing…" : "Confirm and publish to development pages"}</button></div>}

    </div>}
  </section>;
}
