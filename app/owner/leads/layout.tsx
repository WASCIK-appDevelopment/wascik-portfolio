import { ReactNode } from "react";

const links = [
  ["Home", "/owner"],
  ["Leads", "/owner/leads"],
  ["Social & Ads", "/owner/social-ads"],
  ["Affiliate Search", "/owner/affiliate-search"],
  ["Click Analytics", "/owner/click-analytics"],
  ["Product Status", "/owner/product-status"],
] as const;

export default function LeadsLayout({ children }: { children: ReactNode }) {
  return <>
    <div style={{ position: "sticky", top: 0, zIndex: 90, background: "rgba(2,9,19,.96)", borderBottom: "1px solid rgba(85,202,255,.2)", padding: "8px 10px", backdropFilter: "blur(12px)" }}>
      <nav aria-label="WASCIK owner console" style={{ maxWidth: 1120, margin: "0 auto", display: "flex", gap: 7, overflowX: "auto" }}>
        {links.map(([label, href]) => <a key={href} href={href} style={{ whiteSpace: "nowrap", color: label === "Leads" ? "#06131d" : "#bceaff", background: label === "Leads" ? "#70dcff" : "rgba(55,167,220,.12)", border: "1px solid rgba(84,201,255,.32)", borderRadius: 999, padding: "8px 11px", fontSize: 12, fontWeight: 850, textDecoration: "none" }}>{label}</a>)}
      </nav>
    </div>
    {children}
  </>;
}
