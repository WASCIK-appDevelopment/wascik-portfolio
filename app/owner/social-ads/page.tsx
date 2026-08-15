import OwnerModuleClient from "../OwnerModuleClient";

export default function SocialAdsPage() {
  return <OwnerModuleClient title="Social & Advertising" description="Plan and manage WASCIK social content, ad concepts, campaigns, and future performance signals from one private module." currentPath="/owner/social-ads">
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Module foundation ready</h2>
      <p style={{ margin: 0, color: "#a9bdcc", lineHeight: 1.6 }}>This route is secured and ready for the next build layer. We will connect Owner AI to campaign planning, post generation, ad briefs, promotion queues, and performance data as those sources are integrated.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
        {["Content planner","Ad campaign workspace","Promotion queue","Performance summaries"].map((item) => <div key={item} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,.03)" }}><strong>{item}</strong><div style={{ marginTop: 5, color: "#71dcff", fontSize: 11 }}>COMING NEXT</div></div>)}
      </div>
    </div>
  </OwnerModuleClient>;
}
