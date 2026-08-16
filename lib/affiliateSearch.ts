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

export const affiliateSearchBrands = [
  { id: "eurooptic", label: "EuroOptic", aliases: ["eurooptic", "euro optic"] },
  { id: "focus-camera", label: "Focus Camera", aliases: ["focus camera"] },
  { id: "lifestyle-focus", label: "Lifestyle by Focus", aliases: ["lifestyle by focus", "lifestyle focus"] },
  { id: "aquacurve", label: "AquaCurve", aliases: ["aquacurve", "aqua curve"] },
  { id: "ticketnetwork", label: "TicketNetwork", aliases: ["ticketnetwork", "ticket network"] },
  { id: "gearup", label: "GearUP", aliases: ["gearup", "gear up"] },
  { id: "dhgate", label: "DHgate", aliases: ["dhgate"] },
  { id: "philips", label: "Philips", aliases: ["philips"] },
  { id: "revomatic", label: "RevoMatic", aliases: ["revomatic", "revo matic"] },
  { id: "arccaptain", label: "ArcCaptain", aliases: ["arccaptain", "arc captain"] },
] as const;

export type AffiliateSearchBrandId = typeof affiliateSearchBrands[number]["id"];

export function isAffiliateSearchBrand(value: string): value is AffiliateSearchBrandId {
  return affiliateSearchBrands.some((brand) => brand.id === value);
}

export const affiliateSearchResultCounts = [5, 10, 15, 20] as const;

export const usStateOptions = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["FL", "Florida"], ["GA", "Georgia"],
  ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"],
  ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
] as const;
