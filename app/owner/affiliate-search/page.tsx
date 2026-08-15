import OwnerModuleClient from "../OwnerModuleClient";

export default function AffiliateSearchPage() {
  return <OwnerModuleClient title="Affiliate Search" description="Research and review affiliate products, offers, and merchant opportunities for WASCIK pages without mixing that work into the lead CRM." currentPath="/owner/affiliate-search">
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Affiliate discovery workspace</h2>
      <p style={{ margin: 0, color: "#a9bdcc", lineHeight: 1.6 }}>The secure route is ready. The next layer will let Owner AI search approved merchant/network data, organize candidates by category, and prepare products for review before anything is published.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
        {["Merchant search","Product candidates","Category batches","Approve for page"].map((item) => <div key={item} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><strong>{item}</strong><div style={{ marginTop: 5, color: "#71dcff", fontSize: 11 }}>FOUNDATION READY</div></div>)}
      </div>
    </div>
  </OwnerModuleClient>;
}
