"use client";

import { FormEvent, useEffect, useState } from "react";
import { AFFILIATE_BATCH_SIZE, affiliateSearchBrands, affiliateSearchCategories, affiliateSearchResultCounts, AffiliateSearchBrandId, AffiliateSearchCategoryId, usStateOptions } from "../../../lib/affiliateSearch";
import ApprovedCatalogPublisher from "./ApprovedCatalogPublisher";
import ProductHealthMonitor from "./ProductHealthMonitor";

const SESSION_KEY = "wascik-owner-console-key";
const SEARCH_SESSION_KEY = "wascik-affiliate-search-session-v1";

type ProductCandidate = {
  id: string;
  merchant: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  affiliateUrl: string;
  imageUrl?: string | null;
  sourceImageUrl?: string | null;
  price?: string | null;
  pagePath?: string | null;
  source: string;
};

type Batch = { brandId?: string | null; brandLabel?: string | null; categoryId: string; categoryLabel: string; requestedCount: number; items: ProductCandidate[] };

export default function AffiliateSearchClient() {
  const [selected, setSelected] = useState<AffiliateSearchCategoryId[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<AffiliateSearchBrandId[]>([]);
  const [batchSize, setBatchSize] = useState<number>(AFFILIATE_BATCH_SIZE);
  const [ticketState, setTicketState] = useState("");
  const [ticketStartDate, setTicketStartDate] = useState("");
  const [ticketEndDate, setTicketEndDate] = useState("");
  const [providers, setProviders] = useState({ impact: false, awin: false });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmationToken, setConfirmationToken] = useState("");
  const [confirmationSummary, setConfirmationSummary] = useState("");
  const [savingApproval, setSavingApproval] = useState(false);

  useEffect(() => {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    if (!key) return;
    const timer = window.setTimeout(() => {
      const savedSearch = sessionStorage.getItem(SEARCH_SESSION_KEY);
      if (savedSearch) {
        try {
          const parsed = JSON.parse(savedSearch) as { seenIds?: unknown; selectedProducts?: unknown; selectedCategories?: unknown; selectedBrands?: unknown; batchSize?: unknown; ticketState?: unknown; ticketStartDate?: unknown; ticketEndDate?: unknown; batches?: unknown; notice?: unknown };
          if (Array.isArray(parsed.seenIds)) setSeenIds(parsed.seenIds.filter((id): id is string => typeof id === "string"));
          if (Array.isArray(parsed.selectedProducts)) setSelectedProducts(parsed.selectedProducts as ProductCandidate[]);
          if (Array.isArray(parsed.selectedCategories)) setSelected(parsed.selectedCategories.filter((id): id is AffiliateSearchCategoryId => typeof id === "string" && affiliateSearchCategories.some((category) => category.id === id)));
          if (Array.isArray(parsed.selectedBrands)) setSelectedBrands(parsed.selectedBrands.filter((id): id is AffiliateSearchBrandId => typeof id === "string" && affiliateSearchBrands.some((brand) => brand.id === id)));
          if (typeof parsed.batchSize === "number" && affiliateSearchResultCounts.some((count) => count === parsed.batchSize)) setBatchSize(parsed.batchSize);
          if (typeof parsed.ticketState === "string") setTicketState(parsed.ticketState);
          if (typeof parsed.ticketStartDate === "string") setTicketStartDate(parsed.ticketStartDate);
          if (typeof parsed.ticketEndDate === "string") setTicketEndDate(parsed.ticketEndDate);
          if (Array.isArray(parsed.batches)) setBatches(parsed.batches as Batch[]);
          if (typeof parsed.notice === "string") setNotice(parsed.notice);
        } catch {
          sessionStorage.removeItem(SEARCH_SESSION_KEY);
        }
      }
      setHydrated(true);
      void fetch("/api/owner/affiliate-search", { headers: { "x-wascik-owner-key": key }, cache: "no-store" })
        .then((response) => response.ok ? response.json() : Promise.reject(new Error("status")))
        .then((data) => setProviders(data.providers || { impact: false, awin: false }))
        .catch(() => setError("Could not check affiliate network connections."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(SEARCH_SESSION_KEY, JSON.stringify({
      seenIds,
      selectedProducts,
      selectedCategories: selected,
      selectedBrands,
      batchSize,
      ticketState,
      ticketStartDate,
      ticketEndDate,
      batches,
      notice,
    }));
  }, [hydrated, seenIds, selectedProducts, selected, selectedBrands, batchSize, ticketState, ticketStartDate, ticketEndDate, batches, notice]);

  function toggle(categoryId: AffiliateSearchCategoryId) {
    setSelected((current) => current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId]);
  }

  function toggleBrand(brandId: AffiliateSearchBrandId) {
    setSelectedBrands((current) => current.includes(brandId) ? current.filter((id) => id !== brandId) : [...current, brandId]);
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!selected.length || loading) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/owner/affiliate-search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ categories: selected, brands: selectedBrands, batchSize, ticketState, ticketStartDate, ticketEndDate, excludeIds: seenIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Affiliate search failed.");
      const nextBatches = Array.isArray(data.batches) ? data.batches as Batch[] : [];
      setBatches(nextBatches);
      const returnedIds = nextBatches.flatMap((batch) => batch.items.map((item) => item.id));
      const nextSeenIds = Array.from(new Set([...seenIds, ...returnedIds]));
      setSeenIds(nextSeenIds);
      setProviders(data.providers || providers);
      setNotice(data.notice || "Review batch prepared.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Affiliate search failed.");
    } finally {
      setLoading(false);
    }
  }

  function removeCandidate(itemId: string) {
    setBatches((current) => current.map((batch) => ({ ...batch, items: batch.items.filter((item) => item.id !== itemId) })));
  }

  function chooseProduct(item: ProductCandidate) {
    const normalize = (value: string) => value.toLowerCase().replace(/&/g, " and ").replace(/\b(the|new)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
    const duplicate = selectedProducts.some((product) =>
      normalize(product.merchant) === normalize(item.merchant) && normalize(product.title) === normalize(item.title),
    );
    if (duplicate) {
      removeCandidate(item.id);
      setNotice(`${item.title} is already in your current Ready selection, so a duplicate was not added.`);
      return;
    }
    setSelectedProducts([...selectedProducts, item]);
    removeCandidate(item.id);
    setNotice(`${item.title} added to your current-session approval queue.`);
  }

  function skipProduct(item: ProductCandidate) {
    removeCandidate(item.id);
    setNotice(`${item.title} skipped for this console session. It will not appear in another search until you sign out.`);
  }

  function removeSelectedProduct(itemId: string) {
    setSelectedProducts((current) => current.filter((item) => item.id !== itemId));
    setConfirmationToken("");
    setConfirmationSummary("");
  }

  async function prepareApproval() {
    if (!selectedProducts.length || savingApproval) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setSavingApproval(true);
    setError("");
    try {
      const response = await fetch("/api/owner/affiliate-search/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ action: "propose", products: selectedProducts.map((item) => ({ ...item, imageUrl: item.sourceImageUrl || item.imageUrl })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not prepare the approval.");
      setConfirmationToken(data.confirmationToken || "");
      setConfirmationSummary(data.summary || "Confirm these products for the private approved catalog.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not prepare the approval.");
    } finally {
      setSavingApproval(false);
    }
  }

  async function confirmApproval() {
    if (!confirmationToken || !selectedProducts.length || savingApproval) return;
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setSavingApproval(true);
    setError("");
    try {
      const response = await fetch("/api/owner/affiliate-search/approved", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
        body: JSON.stringify({ action: "confirm", confirmationToken, products: selectedProducts.map((item) => ({ ...item, imageUrl: item.sourceImageUrl || item.imageUrl })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the approved products.");
      setSelectedProducts([]);
      setConfirmationToken("");
      setConfirmationSummary("");
      setReviewOpen(false);
      setNotice(data.message || "Products saved to the private approved catalog. Nothing was published.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the approved products.");
    } finally {
      setSavingApproval(false);
    }
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <ProductHealthMonitor />
    <section style={{ padding: 16, border: "1px solid rgba(105,214,255,.28)", borderRadius: 18, background: "linear-gradient(135deg,rgba(34,132,255,.13),rgba(0,205,218,.06))" }}>
      <div style={{ color: "#72e0ff", fontWeight: 900, fontSize: 11, letterSpacing: ".12em" }}>AFFILIATE SEARCH WORKFLOW</div>
      <h2 style={{ margin: "8px 0 7px" }}>Choose brands and categories → fetch 5–20 each → review</h2>
      <p style={{ margin: 0, color: "#aec4d2", lineHeight: 1.6 }}>You select the categories. Owner AI will search only connected, approved affiliate-network data and prepare the number of real product candidates you request for every selected category. Products already shown are excluded from later searches during this signed-in session. Nothing is published automatically—you decide what belongs on WASCIK affiliate pages.</p>
    </section>

    <section style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
      <div style={{ padding: 13, border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }}><strong>Impact</strong><div style={{ color: providers.impact ? "#8ff0b6" : "#ffcf76", marginTop: 5, fontSize: 12 }}>{providers.impact ? "CONNECTED" : "CONNECTION REQUIRED"}</div></div>
      <div style={{ padding: 13, border: "1px solid rgba(255,255,255,.1)", borderRadius: 14 }}><strong>Awin</strong><div style={{ color: providers.awin ? "#8ff0b6" : "#ffcf76", marginTop: 5, fontSize: 12 }}>{providers.awin ? "CONNECTED" : "CONNECTION REQUIRED"}</div></div>
    </section>

    <form onSubmit={search} style={{ display: "grid", gap: 13 }}>
      <details style={{ padding: 13, borderRadius: 14, border: "1px solid rgba(105,214,255,.25)", background: "rgba(255,255,255,.025)" }}>
        <summary style={{ cursor: "pointer", color: "#72e0ff", fontWeight: 900, fontSize: 17 }}>My Brands {selectedBrands.length ? `· ${selectedBrands.map((id) => affiliateSearchBrands.find((brand) => brand.id === id)?.label).filter(Boolean).join(", ")}` : ""}</summary>
        {selectedBrands.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 11 }}>{selectedBrands.map((id) => { const brand = affiliateSearchBrands.find((entry) => entry.id === id); return brand ? <span key={id} style={{ padding: "6px 9px", borderRadius: 999, background: "rgba(39,155,221,.22)", color: "#c9f4ff", fontSize: 12, fontWeight: 800 }}>{brand.label}</span> : null; })}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 8, marginTop: 12 }}>
          {affiliateSearchBrands.map((brand) => { const active = selectedBrands.includes(brand.id); return <button type="button" key={brand.id} onClick={() => toggleBrand(brand.id)} aria-pressed={active} style={{ minHeight: 44, padding: "9px 10px", textAlign: "left", borderRadius: 11, border: active ? "1px solid #66ddff" : "1px solid rgba(255,255,255,.12)", background: active ? "rgba(31,148,211,.22)" : "rgba(255,255,255,.03)", color: "white", fontWeight: 800 }}>{active ? "✓ " : ""}{brand.label}</button>; })}
        </div>
      </details>
      {selectedBrands.includes("ticketnetwork") && <section style={{ display: "grid", gap: 10, padding: 13, borderRadius: 14, border: "1px solid rgba(255,207,118,.35)", background: "rgba(92,61,6,.13)" }}>
        <strong style={{ color: "#ffdc91" }}>TicketNetwork search area and dates</strong>
        <label style={{ display: "grid", gap: 5 }}><span>Which state?</span><select required value={ticketState} onChange={(event) => setTicketState(event.target.value)} style={{ minHeight: 46, borderRadius: 10, padding: "8px 10px", fontSize: 16, background: "#07151d", color: "white", border: "1px solid rgba(255,255,255,.2)" }}><option value="">Select a state</option>{usStateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}>
          <label style={{ display: "grid", gap: 5 }}><span>Start date</span><input required type="date" value={ticketStartDate} onChange={(event) => setTicketStartDate(event.target.value)} style={{ minHeight: 46, borderRadius: 10, padding: "8px", fontSize: 16, background: "#07151d", color: "white", border: "1px solid rgba(255,255,255,.2)" }} /></label>
          <label style={{ display: "grid", gap: 5 }}><span>End date</span><input required type="date" min={ticketStartDate || undefined} value={ticketEndDate} onChange={(event) => setTicketEndDate(event.target.value)} style={{ minHeight: 46, borderRadius: 10, padding: "8px", fontSize: 16, background: "#07151d", color: "white", border: "1px solid rgba(255,255,255,.2)" }} /></label>
        </div>
      </section>}
      <label style={{ display: "grid", gap: 5, maxWidth: 280 }}><strong>Results per category</strong><select value={batchSize} onChange={(event) => setBatchSize(Number(event.target.value))} style={{ minHeight: 46, borderRadius: 10, padding: "8px 10px", fontSize: 16, background: "#07151d", color: "white", border: "1px solid rgba(255,255,255,.2)" }}>{affiliateSearchResultCounts.map((count) => <option key={count} value={count}>{count} products per category</option>)}</select></label>
      <div><h2 style={{ margin: "0 0 5px" }}>Select product categories</h2><p style={{ margin: 0, color: "#9fb6c5" }}>Each selected category requests a separate batch of {batchSize} products.</p></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 9 }}>
        {affiliateSearchCategories.map((category) => {
          const active = selected.includes(category.id);
          return <button type="button" key={category.id} onClick={() => toggle(category.id)} aria-pressed={active} style={{ minHeight: 52, padding: "10px 12px", textAlign: "left", borderRadius: 13, border: active ? "1px solid #66ddff" : "1px solid rgba(255,255,255,.12)", background: active ? "rgba(31,148,211,.22)" : "rgba(255,255,255,.03)", color: "white", fontWeight: 800, cursor: "pointer" }}>{active ? "✓ " : ""}{category.label}</button>;
        })}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><button type="submit" disabled={!selected.length || loading || (selectedBrands.includes("ticketnetwork") && (!ticketState || !ticketStartDate || !ticketEndDate))} style={{ minHeight: 48, padding: "11px 18px", border: 0, borderRadius: 13, background: "linear-gradient(135deg,#2678ff,#09b9cf)", color: "white", fontWeight: 900, cursor: "pointer", opacity: !selected.length || loading || (selectedBrands.includes("ticketnetwork") && (!ticketState || !ticketStartDate || !ticketEndDate)) ? .55 : 1 }}>{loading ? "Preparing batches…" : `Find ${batchSize} per ${selectedBrands.length ? "brand/category" : "category"}`}</button><span style={{ color: "#8faaba", fontSize: 13 }}>{selected.length} categories · up to {selected.length * Math.max(1, selectedBrands.length) * batchSize} candidates</span></div>
    </form>

    {error && <p style={{ margin: 0, padding: 12, borderRadius: 12, background: "#3a1219", color: "#ffd7dc" }}>{error}</p>}
    {notice && <p style={{ margin: 0, padding: 12, borderRadius: 12, background: "#102d22", color: "#bdf4cd" }}>{notice}</p>}

    <section style={{ padding: 15, borderRadius: 16, border: "1px solid rgba(255,214,92,.42)", background: "rgba(84,65,6,.18)" }}>
      <h2 style={{ margin: "0 0 5px" }}>Selected for Affiliate Services · {selectedProducts.length}</h2>
      <p style={{ margin: 0, color: "#c9bb82", lineHeight: 1.5 }}>These choices are waiting for your review. Saving them creates a private approved catalog record only—it does not publish anything to the public website.</p>
      {selectedProducts.length > 0 && <button type="button" onClick={() => { setReviewOpen((open) => !open); setConfirmationToken(""); setConfirmationSummary(""); }} style={{ width: "100%", minHeight: 48, marginTop: 12, borderRadius: 12, border: "1px solid #ffd45c", background: "#5b4608", color: "#fff3bd", fontWeight: 900 }}>{reviewOpen ? "Close review" : `Review ${selectedProducts.length} selected product${selectedProducts.length === 1 ? "" : "s"}`}</button>}
      {reviewOpen && selectedProducts.length > 0 && <div style={{ display: "grid", gap: 9, marginTop: 12 }}>
        {selectedProducts.map((item) => <div key={item.id} style={{ display: "grid", gridTemplateColumns: "54px minmax(0,1fr) auto", gap: 10, alignItems: "center", padding: 10, borderRadius: 10, background: "rgba(0,0,0,.25)" }}>{item.imageUrl ? <img src={item.imageUrl} alt={item.title} style={{ width: 54, height: 54, objectFit: "contain", borderRadius: 8, background: "white" }} /> : <div aria-label="No product image available" style={{ width: 54, height: 54, display: "grid", placeItems: "center", borderRadius: 8, background: "#18262e", color: "#7f9aa8", fontSize: 9, textAlign: "center" }}>No image</div>}<div style={{ minWidth: 0 }}><strong style={{ display: "block", lineHeight: 1.25 }}>{item.title}</strong><span style={{ display: "block", color: "#8fb3c4", fontSize: 12, marginTop: 3 }}>{item.merchant} · {item.category}</span></div><button type="button" onClick={() => removeSelectedProduct(item.id)} style={{ minHeight: 38, borderRadius: 9, border: "1px solid #7a8790", background: "#17232a", color: "#e3edf1", fontWeight: 800 }}>Remove</button></div>)}
        {!confirmationToken && <button type="button" onClick={prepareApproval} disabled={savingApproval} style={{ minHeight: 48, borderRadius: 12, border: "1px solid #ffd45c", background: "#725809", color: "white", fontWeight: 900, opacity: savingApproval ? .6 : 1 }}>{savingApproval ? "Preparing confirmation…" : "Prepare approval"}</button>}
        {confirmationToken && <div style={{ padding: 14, borderRadius: 13, border: "2px solid #ffd45c", background: "#403200", color: "#fff4bd" }}><div style={{ fontSize: 12, fontWeight: 950, letterSpacing: ".12em" }}>CONFIRM CATALOG SAVE</div><p style={{ lineHeight: 1.5 }}>{confirmationSummary}</p><button type="button" onClick={confirmApproval} disabled={savingApproval} style={{ width: "100%", minHeight: 48, borderRadius: 11, border: 0, background: "#ffd45c", color: "#201800", fontWeight: 950, opacity: savingApproval ? .6 : 1 }}>{savingApproval ? "Saving…" : "Confirm and save privately"}</button></div>}
      </div>}
      {selectedProducts.length === 0 && <p style={{ margin: "10px 0 0", color: "#8fa7b5" }}>Choose products from the search results to build a review list.</p>}
    </section>

    <ApprovedCatalogPublisher />

    {batches.map((batch) => <section key={`${batch.brandId || "all"}:${batch.categoryId}`} style={{ display: "grid", gap: 10 }}>
      <div>{batch.brandLabel && <div style={{ color: "#70dcff", fontSize: 12, fontWeight: 900, marginBottom: 4 }}>{batch.brandLabel}</div>}<h2 style={{ margin: 0 }}>{batch.categoryLabel}</h2><p style={{ margin: "4px 0 0", color: "#91aebe" }}>{batch.items.length} of {batch.requestedCount} currently available for review</p></div>
      {batch.items.length === 0 ? <div style={{ padding: 15, borderRadius: 14, border: "1px dashed rgba(255,255,255,.2)", color: "#a7bdca" }}>No approved local items match yet. A live Impact or Awin feed connection is required to fill this requested batch.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10 }}>
        {batch.items.map((item) => <article key={item.id} style={{ padding: 14, borderRadius: 15, border: "1px solid rgba(255,255,255,.11)", background: "rgba(255,255,255,.035)" }}>{item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: "100%", height: 150, objectFit: "contain", borderRadius: 11, background: "white", marginBottom: 10 }} />}<div style={{ color: "#70dcff", fontSize: 11, fontWeight: 900 }}>{item.merchant}</div><h3 style={{ margin: "6px 0", fontSize: 17 }}>{item.title}</h3>{item.price && <div style={{ color: "#8ff0b6", fontWeight: 900, marginBottom: 6 }}>{item.price}</div>}<p style={{ color: "#aabfcb", lineHeight: 1.5, fontSize: 13 }}>{item.description}</p><small style={{ color: "#7899aa" }}>{item.source}</small><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 12 }}><button type="button" onClick={() => chooseProduct(item)} style={{ minHeight: 42, borderRadius: 10, border: "1px solid #58d38d", background: "#12442a", color: "#d9ffe7", fontWeight: 900 }}>Choose</button><button type="button" onClick={() => skipProduct(item)} style={{ minHeight: 42, borderRadius: 10, border: "1px solid #647681", background: "#17232a", color: "#d8e4ea", fontWeight: 900 }}>Not this time</button></div></article>)}
      </div>}
    </section>)}
  </div>;
}
