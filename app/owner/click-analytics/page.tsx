import OwnerModuleClient from "../OwnerModuleClient";

export default function ClickAnalyticsPage() {
  return <OwnerModuleClient title="Click Analytics" description="Your private view of WASCIK outbound affiliate-link activity by page, merchant, product, and source." currentPath="/owner/click-analytics">
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>First-party click tracking workspace</h2>
      <p style={{ margin: 0, color: "#a9bdcc", lineHeight: 1.6 }}>This module is now separated from affiliate discovery. The next build layer will store WASCIK click events in Supabase and turn them into totals, trends, top pages, top merchants, and source analysis.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
        {["Total outbound clicks","Top affiliate pages","Top merchants/products","Source & referrer analysis"].map((item) => <div key={item} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><strong>{item}</strong><div style={{ marginTop: 5, color: "#71dcff", fontSize: 11 }}>TRACKING LAYER NEXT</div></div>)}
      </div>
    </div>
  </OwnerModuleClient>;
}
