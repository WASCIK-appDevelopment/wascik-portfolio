import OwnerModuleClient from "../OwnerModuleClient";

const steps = [
  ["1 · FIND", "Search Impact and Awin for brands matching your chosen categories, audience, products, commission needs, and promotional methods."],
  ["2 · REVIEW", "Compare the brand, catalog depth, deep-link support, media assets, commission, cookie window, restrictions, and contract terms."],
  ["3 · APPROVE", "Owner AI prepares the exact application and promotional explanation. You review it in a yellow confirmation card before anything is submitted."],
  ["4 · ONBOARD", "Track the application. When the network marks it approved and active, add the brand to My Brands and make its products searchable."],
] as const;

export default function BrandDiscoveryPage() {
  return <OwnerModuleClient title="Brand Discovery" description="Find suitable affiliate brands, review their contracts, approve applications, and bring accepted brands into the WASCIK product-search workflow." currentPath="/owner/brand-discovery">
    <div style={{ display: "grid", gap: 16 }}>
      <section style={{ padding: 15, borderRadius: 16, border: "1px solid rgba(105,214,255,.3)", background: "linear-gradient(135deg,rgba(30,119,180,.15),rgba(3,26,43,.35))" }}>
        <div style={{ color: "#72e0ff", fontSize: 11, fontWeight: 950, letterSpacing: ".13em" }}>OWNER-CONTROLLED BRAND ACQUISITION</div>
        <h2 style={{ margin: "8px 0 6px" }}>AI does the research and preparation. You control every application.</h2>
        <p style={{ margin: 0, color: "#abc1ce", lineHeight: 1.6 }}>No brand application, contract acceptance, or external account change may occur merely because AI recommends it. Submission requires your signed, short-lived confirmation.</p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
        <div style={{ padding: 13, borderRadius: 14, border: "1px solid rgba(255,255,255,.11)", background: "rgba(255,255,255,.03)" }}><strong>Impact</strong><div style={{ marginTop: 5, color: "#8ff0b6", fontSize: 12, fontWeight: 900 }}>API CONNECTED</div></div>
        <div style={{ padding: 13, borderRadius: 14, border: "1px solid rgba(255,255,255,.11)", background: "rgba(255,255,255,.03)" }}><strong>Awin</strong><div style={{ marginTop: 5, color: "#8ff0b6", fontSize: 12, fontWeight: 900 }}>API CONNECTED</div></div>
      </section>

      <section style={{ display: "grid", gap: 9 }}>
        {steps.map(([label, text]) => <article key={label} style={{ padding: 14, borderRadius: 14, border: "1px solid rgba(89,203,255,.22)", background: "rgba(255,255,255,.025)" }}><div style={{ color: "#70dcff", fontSize: 12, fontWeight: 950, letterSpacing: ".09em" }}>{label}</div><p style={{ margin: "6px 0 0", color: "#b2c5d0", lineHeight: 1.55 }}>{text}</p></article>)}
      </section>

      <section style={{ padding: 15, borderRadius: 15, border: "1px solid rgba(255,207,118,.38)", background: "rgba(91,61,7,.15)" }}>
        <strong style={{ color: "#ffda8a" }}>Next build checkpoint</strong>
        <p style={{ margin: "6px 0 0", color: "#cbbd9d", lineHeight: 1.55 }}>Connect live marketplace brand discovery and contract retrieval first. Then add the yellow application-confirmation workflow, application-status tracking, and automatic My Brands synchronization after verified network approval.</p>
      </section>
    </div>
  </OwnerModuleClient>;
}
