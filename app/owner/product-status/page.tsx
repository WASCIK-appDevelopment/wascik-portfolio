import OwnerModuleClient from "../OwnerModuleClient";

export default function ProductStatusPage() {
  return <OwnerModuleClient title="Product Status" description="Maintain the affiliate catalog by surfacing stale links, missing media, availability concerns, and listings that need review." currentPath="/owner/product-status">
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Catalog maintenance workspace</h2>
      <p style={{ margin: 0, color: "#a9bdcc", lineHeight: 1.6 }}>The secure route is ready. We will connect product inventory/status checks here so Owner AI can flag listings that need attention without automatically removing or changing anything.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
        {["Link health","Availability review","Missing images/details","Stale listing queue"].map((item) => <div key={item} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><strong>{item}</strong><div style={{ marginTop: 5, color: "#71dcff", fontSize: 11 }}>MONITORING LAYER NEXT</div></div>)}
      </div>
    </div>
  </OwnerModuleClient>;
}
