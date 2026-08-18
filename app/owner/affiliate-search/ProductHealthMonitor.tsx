"use client";

import { useEffect, useState } from "react";
const SESSION_KEY = "wascik-owner-console-key";
type Candidate = { id: string; merchant: string; title: string; reason: string; kind: string; affiliateUrl: string; removable: boolean; source: "builtin" | "uploaded" };
type ImageRepair = { id: string; source: "builtin" | "uploaded"; imageUrl: string; sourcePageUrl: string };

export default function ProductHealthMonitor() {
  const [scanning, setScanning] = useState(true);
  const [counts, setCounts] = useState({ products: 0, brands: 0 });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [imageRepairs, setImageRepairs] = useState<ImageRepair[]>([]);
  const [repairing, setRepairing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function scan() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    if (!key) return;
    setScanning(true); setError(""); setNotice(""); setToken(""); setSelected([]);
    try {
      const response = await fetch("/api/owner/affiliate-search/health", { headers: { "x-wascik-owner-key": key }, cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not check published affiliate products.");
      setCounts({ products: Number(data.checkedCount) || 0, brands: Number(data.brandCount) || 0 });
      setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
      const repairs = Array.isArray(data.imageRepairs) ? data.imageRepairs as ImageRepair[] : [];
      setImageRepairs(repairs);
      if (repairs.length) {
        setRepairing(true);
        const repairResponse = await fetch("/api/owner/affiliate-search/health", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-wascik-owner-key": key },
          body: JSON.stringify({ action: "repair_images", items: repairs }),
        });
        const repairData = await repairResponse.json().catch(() => ({}));
        if (!repairResponse.ok) throw new Error(repairData.error || "Could not repair missing published pictures.");
        setImageRepairs([]);
        setNotice(`${data.message || "Product check finished."} ${repairData.message || "Missing published pictures repaired."}`);
      } else {
        setNotice(data.message || "Product check finished.");
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not check published affiliate products."); }
    finally { setScanning(false); setRepairing(false); }
  }

  useEffect(() => { void scan(); }, []);
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); setToken(""); }

  async function ignoreWarning(item: Candidate, scope: "item" | "brand") {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setError("");
    const response = await fetch("/api/owner/affiliate-search/health", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key }, body: JSON.stringify({ action: "ignore_warning", scope, items: [item] }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setError(data.error || "Could not save the ignore choice.");
    setCandidates((current) => current.filter((candidate) => scope === "brand" ? !(candidate.merchant === item.merchant && candidate.kind === item.kind) : !(candidate.id === item.id && candidate.source === item.source && candidate.kind === item.kind)));
    setNotice(data.message || "Warning ignored.");
  }

  async function repairImages() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    setRepairing(true); setError("");
    try {
      const response = await fetch("/api/owner/affiliate-search/health", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key }, body: JSON.stringify({ action: "repair_images", items: imageRepairs }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not refresh merchant thumbnails.");
      setImageRepairs([]); setNotice(data.message || "Merchant thumbnails refreshed.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not refresh merchant thumbnails."); }
    finally { setRepairing(false); }
  }

  async function prepareRemoval() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    const items = candidates.filter((item) => selected.includes(`${item.source}:${item.id}`));
    const response = await fetch("/api/owner/affiliate-search/health", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key }, body: JSON.stringify({ action: "propose_remove", items }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setError(data.error || "Could not prepare removal.");
    setToken(data.confirmationToken || ""); setSummary(data.summary || "Confirm removal.");
  }

  async function confirmRemoval() {
    const key = sessionStorage.getItem(SESSION_KEY) || "";
    const items = candidates.filter((item) => selected.includes(`${item.source}:${item.id}`));
    const response = await fetch("/api/owner/affiliate-search/health", { method: "POST", headers: { "Content-Type": "application/json", "x-wascik-owner-key": key }, body: JSON.stringify({ action: "confirm_remove", items, confirmationToken: token }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setError(data.error || "Could not remove products.");
    await scan();
  }

  return <section style={{ padding: 15, borderRadius: 16, border: "1px solid rgba(255,214,92,.42)", background: "rgba(84,65,6,.18)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}><div><h2 style={{ margin: 0 }}>Owner AI Product Check</h2><p style={{ margin: "5px 0 0", color: "#c9bb82", lineHeight: 1.5 }}>Starts automatically when this page opens. Nothing is removed without your yellow confirmation.</p></div><button type="button" onClick={scan} disabled={scanning} style={{ minHeight: 40, borderRadius: 10, border: "1px solid #d1a94a", background: "#352b11", color: "#ffe7a3", fontWeight: 900 }}>{scanning ? "Checking…" : "Check again"}</button></div>
    {scanning && <p style={{ color: "#ffe7a3" }}>Checking products, brands, merchant links, and dated events…</p>}
    {!scanning && counts.products > 0 && <p style={{ color: "#9fb8c5" }}>Checked {counts.products} listings across {counts.brands} brands.</p>}
    {!scanning && imageRepairs.length > 0 && <button type="button" onClick={repairImages} disabled={repairing} style={{ width: "100%", minHeight: 44, marginBottom: 10, borderRadius: 10, border: "1px solid #62d899", background: "#123b28", color: "#d5ffe5", fontWeight: 900, opacity: repairing ? .6 : 1 }}>{repairing ? "Refreshing thumbnails…" : `Repair ${imageRepairs.length} missing published picture${imageRepairs.length === 1 ? "" : "s"}`}</button>}
    {error && <p style={{ padding: 10, borderRadius: 10, background: "#3a1219", color: "#ffd7dc" }}>{error}</p>}
    {notice && !scanning && <p style={{ padding: 10, borderRadius: 10, background: candidates.length ? "#493607" : "#102d22", color: candidates.length ? "#ffe9a8" : "#bdf4cd" }}>{notice}</p>}
    {candidates.length > 0 && <div style={{ display: "grid", gap: 8 }}>{candidates.map((item) => { const selectionId = `${item.source}:${item.id}`; return <article key={selectionId} style={{ padding: 10, borderRadius: 10, background: "rgba(0,0,0,.25)" }}><strong>{item.title}</strong><div style={{ color: "#82cfe8", fontSize: 12 }}>{item.merchant}</div><div style={{ marginTop: 4, color: "#ffd77e", fontSize: 12 }}>{item.reason}</div><div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}><a href={item.affiliateUrl} target="_blank" rel="noopener noreferrer" style={{ minHeight: 38, display: "grid", placeItems: "center", padding: "4px 10px", borderRadius: 9, border: "1px solid #49b976", color: "#c8f9d9", textDecoration: "none", fontWeight: 900 }}>Review listing ↗</a><button type="button" onClick={() => ignoreWarning(item, "item")} style={{ minHeight: 38, borderRadius: 9, border: "1px solid #49b976", background: "#113523", color: "#c8f9d9", fontWeight: 900 }}>Ignore this warning</button><button type="button" onClick={() => ignoreWarning(item, "brand")} style={{ minHeight: 38, borderRadius: 9, border: "1px solid #3a9660", background: "#0d291b", color: "#b8eccb", fontWeight: 900 }}>Ignore this brand warning</button><button type="button" onClick={() => toggle(selectionId)} style={{ minHeight: 38, borderRadius: 9, border: selected.includes(selectionId) ? "1px solid #ffd45c" : "1px solid #c85b68", background: selected.includes(selectionId) ? "#725809" : "#3b151b", color: "white", fontWeight: 900 }}>{selected.includes(selectionId) ? "✓ Selected to remove" : "Remove from publication"}</button></div></article>})}</div>}
    {selected.length > 0 && !token && <button type="button" onClick={prepareRemoval} style={{ width: "100%", minHeight: 48, marginTop: 10, borderRadius: 11, border: "1px solid #ffd45c", background: "#725809", color: "white", fontWeight: 950 }}>Review removal of {selected.length} product{selected.length === 1 ? "" : "s"}</button>}
    {token && <div style={{ marginTop: 10, padding: 14, borderRadius: 13, border: "2px solid #ffd45c", background: "#403200", color: "#fff4bd" }}><div style={{ fontSize: 12, fontWeight: 950, letterSpacing: ".12em" }}>CONFIRM REMOVAL</div><p>{summary}</p><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}><button type="button" onClick={() => setToken("")} style={{ minHeight: 46, borderRadius: 10, border: "1px solid #e2c96e", background: "transparent", color: "#fff4bd", fontWeight: 900 }}>Cancel</button><button type="button" onClick={confirmRemoval} style={{ minHeight: 46, borderRadius: 10, border: 0, background: "#ffd45c", color: "#201800", fontWeight: 950 }}>Confirm removal</button></div></div>}
  </section>;
}
