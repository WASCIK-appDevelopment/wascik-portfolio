"use client";

type CatalogProduct = {
  id: string;
  merchant: string;
  title: string;
  category?: string | null;
  description?: string | null;
  features?: string[] | null;
  affiliate_url?: string | null;
  image_url?: string | null;
  price?: string | null;
  page_path?: string | null;
  published_at?: string | null;
  source?: string | null;
};

type Props = {
  products: CatalogProduct[];
  opening: string;
  onStart: (item: CatalogProduct) => void;
};

const campaignProfiles = [
  {
    merchant: "GearUP",
    preferredTitle: "GearUP for Mobile",
    label: "GearUP",
    description: "Gaming network optimization campaign",
  },
  {
    merchant: "ArcCaptain",
    preferredTitle: "ArcCaptain Welding Equipment",
    label: "ArcCaptain",
    description: "Welding equipment & accessories campaign",
  },
  {
    merchant: "TicketNetwork",
    preferredTitle: "TicketNetwork Concerts & Event Tickets",
    label: "TicketNetwork",
    description: "Concerts, sports & live-event campaign",
  },
] as const;

export default function AffiliateBrandCampaigns({ products, opening, onStart }: Props) {
  const campaigns = campaignProfiles
    .map((profile) => {
      const exact = products.find((item) => item.merchant === profile.merchant && item.title === profile.preferredTitle);
      const fallback = products.find((item) => item.merchant === profile.merchant);
      return exact || fallback ? { profile, item: exact || fallback! } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (!campaigns.length) return null;

  return <section style={{ border: "1px solid rgba(113,220,255,.22)", borderRadius: 17, padding: 15, background: "linear-gradient(135deg,rgba(113,220,255,.045),rgba(5,20,33,.74))" }}>
    <div>
      <div style={{ color: "#71dcff", fontSize: 11, fontWeight: 950, letterSpacing: ".12em" }}>AFFILIATE BRAND CAMPAIGNS</div>
      <h2 style={{ margin: "5px 0 0" }}>Start an ad without choosing a specific product</h2>
      <p style={{ margin: "6px 0 0", color: "#9fb5c5", lineHeight: 1.5, fontSize: 13 }}>Use these for general brand/service campaigns. TicketNetwork event listings and any individual products still remain available in the product library below.</p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 13 }}>
      {campaigns.map(({ profile, item }) => {
        const isOpening = opening === item.id;
        return <button
          key={profile.merchant}
          type="button"
          disabled={isOpening}
          aria-busy={isOpening}
          onClick={() => onStart(item)}
          style={{
            textAlign: "left",
            border: "1px solid rgba(113,220,255,.24)",
            borderRadius: 14,
            padding: 13,
            background: "rgba(113,220,255,.045)",
            color: "#eef8ff",
            cursor: isOpening ? "wait" : "pointer",
            minHeight: 118,
            opacity: isOpening ? .65 : 1,
            touchAction: "manipulation",
          }}
        >
          <div style={{ color: "#71dcff", fontSize: 12, fontWeight: 950 }}>{profile.label}</div>
          <div style={{ marginTop: 7, fontSize: 15, fontWeight: 900 }}>{isOpening ? "Opening…" : "Start Brand Ad"}</div>
          <div style={{ marginTop: 6, color: "#9fb5c5", fontSize: 12, lineHeight: 1.4 }}>{profile.description}</div>
        </button>;
      })}
    </div>
  </section>;
}
