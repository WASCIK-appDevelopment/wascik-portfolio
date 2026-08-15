import OwnerModuleClient from "./OwnerModuleClient";

const cards = [
  { title: "Lead CRM", href: "/owner/leads", status: "LIVE", text: "Review captured leads, conversations, notes, follow-ups, statuses, and Owner AI actions." },
  { title: "Social & Advertising", href: "/owner/social-ads", status: "FOUNDATION", text: "Plan posts, campaigns, ad creative, promotion ideas, and future performance tracking." },
  { title: "Affiliate Search", href: "/owner/affiliate-search", status: "FOUNDATION", text: "Discover and review products and offers for affiliate pages across approved networks." },
  { title: "Click Analytics", href: "/owner/click-analytics", status: "FOUNDATION", text: "Track your own outbound affiliate clicks by page, merchant, product, and source." },
  { title: "Product Status", href: "/owner/product-status", status: "FOUNDATION", text: "Monitor affiliate listings for stale links, availability, missing images, and maintenance needs." },
];

export default function OwnerHomePage() {
  return <OwnerModuleClient title="Owner Console" description="Your private WASCIK business command center. Each business function gets its own module while Owner AI eventually connects intelligence across all of them." currentPath="/owner">
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <a href="/" style={{ display: "inline-flex", alignItems: "center", minHeight: 42, padding: "9px 14px", borderRadius: 12, border: "1px solid rgba(112,227,255,.35)", background: "rgba(36,132,255,.12)", color: "#bdefff", textDecoration: "none", fontWeight: 800, fontSize: 13 }}>← Back to WASCIK Portfolio</a>
      </div>

      <div style={{ padding: 16, borderRadius: 18, background: "linear-gradient(135deg,rgba(36,132,255,.16),rgba(0,199,217,.08))", border: "1px solid rgba(100,210,255,.25)" }}>
        <div style={{ color: "#70e3ff", fontWeight: 900, fontSize: 12, letterSpacing: ".12em" }}>OWNER AI COMMAND CENTER</div>
        <h2 style={{ margin: "8px 0 5px", fontSize: 26 }}>One console, separate business modules</h2>
        <p style={{ margin: 0, color: "#b8cad7", lineHeight: 1.55 }}>Leads is operational now. The remaining modules have secure routes and will be connected to live data and Owner AI one by one.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {cards.map((card) => <a href={card.href} key={card.href} style={{ textDecoration: "none", color: "inherit", border: "1px solid rgba(255,255,255,.1)", borderRadius: 18, padding: 16, background: "rgba(255,255,255,.035)" }}>
          <span style={{ color: card.status === "LIVE" ? "#8ff0b6" : "#78d9ff", fontSize: 10, fontWeight: 900, letterSpacing: ".12em" }}>{card.status}</span>
          <h3 style={{ margin: "7px 0", fontSize: 20 }}>{card.title}</h3>
          <p style={{ margin: 0, color: "#9fb2c1", lineHeight: 1.5, fontSize: 14 }}>{card.text}</p>
        </a>)}
      </div>
    </div>
  </OwnerModuleClient>;
}
