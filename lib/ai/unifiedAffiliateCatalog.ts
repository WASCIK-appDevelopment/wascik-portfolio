import { affiliateProducts } from "../../app/affiliate-services/products";

export type UnifiedAffiliateItem = {
  id: string;
  merchant: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  affiliateUrl: string;
  source: "central-catalog" | "brand-page";
  pagePath?: string;
};

const centralCatalog: UnifiedAffiliateItem[] = affiliateProducts.map((product) => ({
  id: `central-${product.id}`,
  merchant: product.merchant,
  title: product.title,
  category: product.category,
  description: product.description,
  features: product.features,
  affiliateUrl: product.affiliateUrl,
  source: "central-catalog",
}));

const brandPageCatalog: UnifiedAffiliateItem[] = [
  {
    id: "eurooptic-garmin-quatix-8-pro",
    merchant: "EuroOptic",
    title: "Garmin Quatix 8 Pro",
    category: "Smartwatches & Outdoor Tech",
    description: "Featured Garmin smartwatch offered through the WASCIK EuroOptic partner page, with current price, availability, specifications, shipping, and returns confirmed at the merchant listing.",
    features: ["Garmin smartwatch", "Outdoor and specialty gear", "Featured EuroOptic product"],
    affiliateUrl: "https://eurooptic.sjv.io/WOEqjX",
    source: "brand-page",
    pagePath: "/affiliate-services/eurooptic",
  },
  {
    id: "eurooptic-store",
    merchant: "EuroOptic",
    title: "EuroOptic Specialty Gear Store",
    category: "Optics, Outdoor Gear & Watches",
    description: "Browse EuroOptic's current optics, outdoor equipment, watches, and specialty gear catalog through WASCIK's tracked store link.",
    features: ["Optics", "Outdoor equipment", "Watches", "Specialty gear"],
    affiliateUrl: "https://eurooptic.sjv.io/c/7587435/2973190/35464",
    source: "brand-page",
    pagePath: "/affiliate-services/eurooptic",
  },
  {
    id: "focus-garmin-dezlcam-otr725",
    merchant: "Focus Camera",
    title: "Garmin dezlCam OTR725",
    category: "GPS Navigation & Dash Cameras",
    description: "A seven-inch GPS truck navigator with a built-in dash camera for professional drivers and life on the road.",
    features: ["7-inch touchscreen", "Built-in dash camera", "Truck navigation"],
    affiliateUrl: "https://focuscamera.pxi6.net/3kzXRX",
    source: "brand-page",
    pagePath: "/affiliate-services/focus-camera",
  },
  {
    id: "focus-camera-store",
    merchant: "Focus Camera",
    title: "Focus Camera Main Store",
    category: "Cameras, Navigation, Electronics & Lifestyle",
    description: "Browse current camera, navigation, electronics, and lifestyle products through WASCIK's tracked Focus Camera store link.",
    features: ["Cameras", "Navigation", "Electronics", "Lifestyle products"],
    affiliateUrl: "https://focuscamera.pxi6.net/c/7587435/642856/10228",
    source: "brand-page",
    pagePath: "/affiliate-services/focus-camera",
  },
  {
    id: "aquacurve-store",
    merchant: "AquaCurve",
    title: "AquaCurve Poolside & Outdoor Living Catalog",
    category: "Poolside Furniture & Outdoor Living",
    description: "Browse AquaCurve's current poolside and outdoor-living catalog through the WASCIK affiliate store link.",
    features: ["Poolside furniture", "Outdoor living", "Patio and leisure products"],
    affiliateUrl: "https://aquacurve.sjv.io/c/7587435/3859681/51362?trafsrc=impact",
    source: "brand-page",
    pagePath: "/affiliate-services/aquacurve",
  },
  {
    id: "gearup-mobile",
    merchant: "GearUP",
    title: "GearUP for Mobile",
    category: "Gaming Network Optimization",
    description: "A mobile game connection-optimization service for Android and iOS players dealing with unstable latency, lag spikes, or high ping.",
    features: ["Android and iOS", "One-tap boosting", "Worldwide game servers", "Connection optimization"],
    affiliateUrl: "https://gearupapp.pxf.io/c/7587435/3911079/53368",
    source: "brand-page",
    pagePath: "/affiliate-services/gearup",
  },
  {
    id: "arccaptain-store",
    merchant: "ArcCaptain",
    title: "ArcCaptain Welding Equipment",
    category: "Welding Equipment & Accessories",
    description: "Browse ArcCaptain MIG, TIG, stick, and plasma equipment, along with welding helmets and accessories through WASCIK's approved affiliate link.",
    features: ["MIG welding", "TIG welding", "Stick and plasma equipment", "Welding helmets and accessories"],
    affiliateUrl: "https://arccaptain.pxf.io/c/7587435/3898395/52929",
    source: "brand-page",
    pagePath: "/affiliate-services#arccaptain",
  },
  {
    id: "ticketnetwork-store",
    merchant: "TicketNetwork",
    title: "TicketNetwork Concerts & Event Tickets",
    category: "Concerts, Events & Tickets",
    description: "Search current TicketNetwork listings for concerts and events through WASCIK's ticket affiliate page.",
    features: ["Concert tickets", "Live events", "Current seat listings", "Ticket resale marketplace"],
    affiliateUrl: "https://goto.ticketnetwork.com/c/7587435/120057/2322",
    source: "brand-page",
    pagePath: "/affiliate-services/ticketnetwork",
  },
];

export const unifiedAffiliateCatalog: UnifiedAffiliateItem[] = [
  ...centralCatalog,
  ...brandPageCatalog,
];
