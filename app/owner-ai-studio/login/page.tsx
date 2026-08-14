"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function OwnerStudioLoginPage() {
  const router = useRouter();
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/owner-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessKey }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    router.replace("/owner-ai-studio");
    router.refresh();
  }

  return (
    <main style={{ minHeight: "100vh", background: "#050914", color: "white", display: "grid", placeItems: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ width: "min(460px, 100%)", padding: 32, borderRadius: 28, border: "1px solid rgba(255,255,255,.12)", background: "#0b1422" }}>
        <p style={{ color: "#78d7ff", fontWeight: 800, letterSpacing: ".12em", fontSize: 12 }}>PRIVATE WASCIK TOOL</p>
        <h1 style={{ margin: "10px 0 12px", fontSize: 38 }}>Owner AI Media Studio</h1>
        <p style={{ color: "#aebed0", lineHeight: 1.6 }}>Enter your private owner access key. This page is not part of the public customer funnel.</p>
        <input
          type="password"
          value={accessKey}
          onChange={(event) => setAccessKey(event.target.value)}
          placeholder="Owner access key"
          autoComplete="current-password"
          style={{ width: "100%", boxSizing: "border-box", marginTop: 20, padding: 15, borderRadius: 14, border: "1px solid rgba(255,255,255,.14)", background: "#07101d", color: "white" }}
        />
        {error ? <p style={{ color: "#ff9b9b" }}>{error}</p> : null}
        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 16, padding: 15, border: 0, borderRadius: 999, fontWeight: 800, background: "linear-gradient(135deg,#2c72ff,#09b7ca)", color: "white" }}>
          {loading ? "Checking access..." : "Open My Studio"}
        </button>
      </form>
    </main>
  );
}
