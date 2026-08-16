export const AFFILIATE_BATCH_SIZE = 20;

export const affiliateSearchCategories = [
  { id: "electronics", label: "Electronics & Smart Tech", keywords: ["electronic", "camera", "monitor", "tablet", "webcam", "charger", "audio", "headphone", "smart", "gps", "drone"] },
  { id: "outdoor", label: "Outdoor, Hunting & Optics", keywords: ["outdoor", "optic", "hunting", "binocular", "tactical", "golf", "pool", "patio"] },
  { id: "tools", label: "Tools, Welding & Workshop", keywords: ["welding", "welder", "tool", "workshop", "plasma", "mig", "tig"] },
  { id: "home", label: "Home, Pool & Outdoor Living", keywords: ["home", "pool", "patio", "lounger", "furniture", "outdoor living", "coffee"] },
  { id: "health", label: "Health, Beauty & Wellness", keywords: ["health", "beauty", "wellness", "massage", "therapy", "skin", "groom"] },
  { id: "gaming", label: "Gaming & Mobile", keywords: ["gaming", "game", "mobile", "latency", "network optimization"] },
  { id: "events", label: "Concerts, Events & Tickets", keywords: ["concert", "ticket", "event", "country", "rock", "hip-hop"] },
  { id: "fashion", label: "Fashion, Footwear & Eyewear", keywords: ["fashion", "shoe", "footwear", "sunglass", "eyewear", "watch"] },
  { id: "creator", label: "Creator, Photo & Music Gear", keywords: ["creator", "camera", "podcast", "microphone", "studio", "drum", "photo", "lighting"] },
  { id: "travel", label: "Travel, Auto & Navigation", keywords: ["travel", "navigation", "gps", "dash", "portable", "vehicle", "road"] },
] as const;

export type AffiliateSearchCategoryId = typeof affiliateSearchCategories[number]["id"];

export function isAffiliateSearchCategory(value: string): value is AffiliateSearchCategoryId {
  return affiliateSearchCategories.some((category) => category.id === value);
}
