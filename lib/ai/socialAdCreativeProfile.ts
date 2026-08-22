export type CreativeProfile = {
  key: string;
  label: string;
  mood: string;
  backgroundDirection: string;
  typography: "tech" | "editorial" | "industrial" | "luxury" | "retail" | "event" | "clean";
  defaultMode: "product" | "composite" | "lifestyle";
};

const known: Array<{ match: RegExp; profile: CreativeProfile }> = [
  { match: /wascik/i, profile: { key: "wascik-tech", label: "WASCIK Tech", mood: "sleek, confident, modern business technology", backgroundDirection: "dark premium technology workspace, architectural lighting, crisp cyan accents, restrained futuristic detail, high-end B2B campaign photography", typography: "tech", defaultMode: "lifestyle" } },
  { match: /aquacurve/i, profile: { key: "aquacurve-lifestyle", label: "AquaCurve Lifestyle", mood: "bright, premium, relaxed outdoor luxury", backgroundDirection: "luxury poolside resort atmosphere, sunlit water reflections, sophisticated patio styling, airy negative space, upscale outdoor-living campaign photography", typography: "luxury", defaultMode: "lifestyle" } },
  { match: /arccaptain/i, profile: { key: "arccaptain-industrial", label: "ArcCaptain Industrial", mood: "rugged, capable, professional fabrication", backgroundDirection: "premium fabrication shop, dramatic directional work light, steel textures, sparks or workshop atmosphere used sparingly, serious professional-tool advertising", typography: "industrial", defaultMode: "composite" } },
  { match: /revomatic/i, profile: { key: "revomatic-wellness", label: "RevoMatic Wellness", mood: "clean, restorative, premium wellness", backgroundDirection: "bright premium wellness studio, soft natural materials, calm spa-inspired light, clean skin-and-recovery campaign aesthetic, uncluttered composition", typography: "clean", defaultMode: "lifestyle" } },
  { match: /coofandy/i, profile: { key: "coofandy-fashion", label: "Coofandy Fashion", mood: "editorial, stylish, confident menswear", backgroundDirection: "fashion editorial setting, sophisticated urban or studio environment, directional portrait lighting, premium menswear campaign composition", typography: "editorial", defaultMode: "lifestyle" } },
  { match: /focus camera|lifestyle by focus/i, profile: { key: "focus-creator", label: "Focus Camera Creator", mood: "creator-focused, crisp, premium imaging", backgroundDirection: "professional creator studio or cinematic location, clean lens-inspired lighting, subtle depth, premium photography-and-video campaign aesthetic", typography: "clean", defaultMode: "composite" } },
  { match: /philips/i, profile: { key: "philips-consumer-tech", label: "Philips Consumer Tech", mood: "clean, trustworthy, refined consumer technology", backgroundDirection: "bright modern home or clean technology environment, precise product-lighting feel, minimal contemporary surfaces, polished consumer-electronics advertising", typography: "clean", defaultMode: "composite" } },
  { match: /dhgate/i, profile: { key: "dhgate-retail", label: "DHgate Retail", mood: "clear, energetic, product-led marketplace retail", backgroundDirection: "clean contemporary ecommerce retail environment, energetic but uncluttered commercial lighting, strong product focus, modern marketplace advertising", typography: "retail", defaultMode: "product" } },
  { match: /euroopt/i, profile: { key: "eurooptic-outdoor", label: "EuroOptic Outdoor", mood: "premium outdoor gear, precise, capable", backgroundDirection: "premium outdoor sporting environment, rugged natural textures, crisp early-morning or golden-hour light, high-end optics and gear campaign aesthetic", typography: "industrial", defaultMode: "composite" } },
  { match: /gearup/i, profile: { key: "gearup-gaming", label: "GearUP Gaming", mood: "fast, competitive, modern gaming", backgroundDirection: "high-performance gaming desk environment, controlled neon accents, motion and speed cues, premium esports campaign styling", typography: "tech", defaultMode: "lifestyle" } },
  { match: /ticketnetwork/i, profile: { key: "ticketnetwork-event", label: "TicketNetwork Events", mood: "energetic live-event excitement", backgroundDirection: "premium live-event atmosphere, concert or arena energy without depicting a specific performer, dramatic crowd lighting, clean promotional negative space", typography: "event", defaultMode: "lifestyle" } },
];

const categoryProfiles: Array<{ match: RegExp; profile: CreativeProfile }> = [
  { match: /camera|photo|video|lens|creator/i, profile: { key: "category-creator", label: "Creator Gear", mood: "crisp creator-focused premium gear", backgroundDirection: "professional creator environment, cinematic light, clean studio depth, premium imaging campaign aesthetic", typography: "clean", defaultMode: "composite" } },
  { match: /fashion|shirt|apparel|clothing|shoe|menswear/i, profile: { key: "category-fashion", label: "Fashion", mood: "editorial and stylish", backgroundDirection: "fashion editorial location or studio, premium directional portrait lighting, uncluttered campaign composition", typography: "editorial", defaultMode: "lifestyle" } },
  { match: /wellness|massage|therapy|recovery|beauty|skin/i, profile: { key: "category-wellness", label: "Wellness", mood: "clean and restorative", backgroundDirection: "premium wellness studio, soft daylight, calm natural textures, sophisticated recovery-and-self-care advertising", typography: "clean", defaultMode: "lifestyle" } },
  { match: /weld|tool|industrial|fabricat|shop/i, profile: { key: "category-industrial", label: "Industrial", mood: "rugged professional capability", backgroundDirection: "professional workshop or fabrication environment, dramatic work light, premium industrial-tool campaign styling", typography: "industrial", defaultMode: "composite" } },
  { match: /pool|patio|outdoor|furniture|chair|home|living/i, profile: { key: "category-lifestyle", label: "Home & Lifestyle", mood: "premium relaxed lifestyle", backgroundDirection: "aspirational home or outdoor-living setting, bright natural light, polished lifestyle campaign photography", typography: "luxury", defaultMode: "lifestyle" } },
  { match: /electronics|tech|smart|lock|doorbell|audio|computer/i, profile: { key: "category-tech", label: "Consumer Tech", mood: "clean modern technology", backgroundDirection: "modern clean technology or home environment, precise lighting, sophisticated consumer-electronics campaign styling", typography: "tech", defaultMode: "composite" } },
  { match: /event|concert|ticket|sports|show/i, profile: { key: "category-event", label: "Events", mood: "high-energy live experience", backgroundDirection: "dramatic live-event atmosphere with strong depth and clean copy-safe space", typography: "event", defaultMode: "lifestyle" } },
];

const fallback: CreativeProfile = {
  key: "generic-premium",
  label: "Premium General",
  mood: "polished, contemporary, commercially credible",
  backgroundDirection: "premium commercial advertising environment tailored to the product context, sophisticated lighting, strong visual hierarchy, generous negative space",
  typography: "clean",
  defaultMode: "composite",
};

export function resolveCreativeProfile(merchant: string, category = "", product = ""): CreativeProfile {
  const brand = known.find((item) => item.match.test(merchant));
  if (brand) return brand.profile;
  const context = `${category} ${product}`;
  const categoryMatch = categoryProfiles.find((item) => item.match.test(context));
  return categoryMatch?.profile || fallback;
}
