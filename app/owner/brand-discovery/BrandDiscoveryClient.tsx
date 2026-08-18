"use client";

import { FormEvent, useEffect, useState } from "react";
import { affiliateSearchCategories, AffiliateSearchCategoryId } from "../../../lib/affiliateSearch";

const DISCOVERY_SESSION_KEY = "wascik-brand-discovery-criteria-v1";

export default function BrandDiscoveryClient() {
  const [categories, setCategories] = useState<AffiliateSearchCategoryId[]>([]);
  const [productTypes, setProductTypes] = useState("");
  const [networks, setNetworks] = useState<string[]>(["impact", "awin"]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(DISCOVERY_SESSION_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { categories?: unknown; productTypes?: unknown; networks?: unknown };
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories.filter((value): value is AffiliateSearchCategoryId => typeof value === "string" && affiliateSearchCategories.some((category) => category.id === value)));
      if (typeof parsed.productTypes === "string") setProductTypes(parsed.productTypes);
      if (Array.isArray(parsed.networks)) setNetworks(parsed.networks.filter((value): value is string => value === "impact" || value === "awin"));
    } catch {
      sessionStorage.removeItem(DISCOVERY_SESSION_KEY);
    }
  }, []);

  function toggleCategory(id: AffiliateSearchCategoryId) {
    setCategories((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setNotice("");
  }

  function toggleNetwork(id: string) {
    setNetworks((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setNotice("");
  }

  function saveCriteria(event: FormEvent) {
    event.preventDefault();
    if (!categories.length && !productTypes.trim()) return;
    sessionStorage.setItem(DISCOVERY_SESSION_KEY, JSON.stringify({ categories, productTypes: productTypes.trim(), networks }));
    setNotice("Your product-based brand criteria are saved for this console session. Live marketplace searching is the next connection step.");
  }

  return <form onSubmit={saveCriteria} style={{ display: "grid", gap: 13, padding: 15, borderRadius: 16, border: "1px solid rgba(105,214,255,.32)", background: "rgba(9,45,65,.22)" }}>
    <div><div style={{ color: "#72e0ff", fontSize: 11, fontWeight: 950, letterSpacing: ".12em" }}>WHAT SHOULD THESE BRANDS SELL?</div><h2 style={{ margin: "7px 0 5px" }}>Choose product categories</h2><p style={{ margin: 0, color: "#a9beca", lineHeight: 1.5 }}>Brand Discovery will return brands only when their available catalogs contain the kinds of products you choose here.</p></div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 8 }}>
      {affiliateSearchCategories.map((category) => {
        const active = categories.includes(category.id);
        return <button type="button" key={category.id} onClick={() => toggleCategory(category.id)} aria-pressed={active} style={{ minHeight: 48, padding: "9px 11px", textAlign: "left", borderRadius: 12, border: active ? "1px solid #65ddff" : "1px solid rgba(255,255,255,.13)", background: active ? "rgba(35,153,211,.23)" : "rgba(255,255,255,.025)", color: "white", fontWeight: 850 }}>{active ? "✓ " : ""}{category.label}</button>;
      })}
    </div>

    <label style={{ display: "grid", gap: 6 }}><strong>Describe specific products you want</strong><textarea value={productTypes} onChange={(event) => { setProductTypes(event.target.value); setNotice(""); }} rows={4} placeholder="Example: welding helmets, plasma cutters, portable welders, and workshop safety equipment" style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid rgba(255,255,255,.18)", background: "#07151d", color: "white", padding: 12, fontSize: 16, lineHeight: 1.45, resize: "vertical" }} /><span style={{ color: "#879fac", fontSize: 12 }}>This description narrows the search beyond the selected categories.</span></label>

    <div><strong>Search these connected networks</strong><div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 7 }}>{[["impact","Impact"],["awin","Awin"]].map(([id,label]) => { const active = networks.includes(id); return <button type="button" key={id} onClick={() => toggleNetwork(id)} aria-pressed={active} style={{ minHeight: 44, borderRadius: 11, border: active ? "1px solid #72e0ff" : "1px solid rgba(255,255,255,.13)", background: active ? "#123f53" : "#111c23", color: "white", fontWeight: 900 }}>{active ? "✓ " : ""}{label}</button>; })}</div></div>

    <button type="submit" disabled={(!categories.length && !productTypes.trim()) || !networks.length} style={{ minHeight: 48, border: 0, borderRadius: 13, background: "linear-gradient(135deg,#2678ff,#09b9cf)", color: "white", fontWeight: 950, opacity: ((!categories.length && !productTypes.trim()) || !networks.length) ? .5 : 1 }}>Save Product-Based Search Criteria</button>
    {notice && <p style={{ margin: 0, padding: 11, borderRadius: 11, background: "#102d22", color: "#bdf4cd", lineHeight: 1.45 }}>{notice}</p>}
  </form>;
}
