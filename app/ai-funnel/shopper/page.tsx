"use client";

import { FormEvent, useState } from "react";

type Recommendation = {
  id: number;
  merchant: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  affiliateUrl: string;
  reason: string;
};

export default function ShopperPage() {
  const [query, setQuery] = useState("");
  const [merchant, setMerchant] = useState("");
  const [results, setResults] = useState<Recommendation[]>([]);
  const [disclosure, setDisclosure] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/ai-funnel/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, merchant: merchant || undefined }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "The shopping assistant could not respond.");
      setResults([]);
    } else {
      setResults(data.recommendations ?? []);
      setDisclosure(data.disclosure ?? "");
    }
    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#050914", color: "white", padding: "54px 18px 90px" }}>
      <div style={{ width: "min(1000px, 100%)", margin: "0 auto" }}>
        <p style={{ color: "#7fd7ff", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 }}>WASCIK SHOPPING ASSISTANT — REASONING TEST</p>
        <h1 style={{ fontSize: "clamp(2.8rem,8vw,5.8rem)", lineHeight: 1, margin: "12px 0 18px" }}>Tell me what you need.</h1>
        <p style={{ maxWidth: 760, color: "#aebed0", lineHeight: 1.7 }}>
          This prototype recommends only from products already present in the WASCIK affiliate catalog. It ranks matches by shopper intent, product category, features, title, and description.
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 28 }}>
          <input required value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Example: I need better security for my front door" style={{ padding: 15, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "#091321", color: "white" }} />
          <select value={merchant} onChange={(event) => setMerchant(event.target.value)} style={{ padding: 15, borderRadius: 14, border: "1px solid rgba(255,255,255,.12)", background: "#091321", color: "white" }}>
            <option value="">Search all current catalog products</option>
            <option value="DHgate">DHgate</option>
            <option value="Philips">Philips</option>
            <option value="RevoMatic">RevoMatic</option>
          </select>
          <button disabled={loading} style={{ padding: 15, borderRadius: 999, border: 0, background: "#236de8", color: "white", fontWeight: 900 }}>
            {loading ? "Finding matches..." : "Find Products"}
          </button>
        </form>

        {error ? <p style={{ color: "#ff9a9a", marginTop: 18 }}>{error}</p> : null}

        <section style={{ display: "grid", gap: 14, marginTop: 30 }}>
          {results.map((product) => (
            <article key={product.id} style={{ padding: 22, borderRadius: 22, border: "1px solid rgba(255,255,255,.1)", background: "#091321" }}>
              <p style={{ color: "#79d7ff", fontWeight: 800, margin: 0 }}>{product.merchant} · {product.category}</p>
              <h2 style={{ margin: "8px 0 10px" }}>{product.title}</h2>
              <p style={{ color: "#b3c1d1", lineHeight: 1.6 }}>{product.description}</p>
              <p style={{ color: "#dcecff" }}><strong>Why it matched:</strong> {product.reason}</p>
              <a href={product.affiliateUrl} target="_blank" rel="sponsored noopener noreferrer" style={{ display: "inline-block", marginTop: 8, color: "#8edfff", fontWeight: 900 }}>View Product →</a>
            </article>
          ))}
        </section>

        {disclosure ? <p style={{ marginTop: 24, color: "#7f91a7", fontSize: 13, lineHeight: 1.55 }}>{disclosure}</p> : null}
      </div>
    </main>
  );
}
