export type AssistantPageRole = "portfolio" | "affiliate-hub" | "affiliate-brand" | "owner-studio" | "general";

export type AssistantPageContext = {
  pathname: string;
  role: AssistantPageRole;
  merchant?: string;
  mode: "services" | "shopping" | "owner" | "general";
  disclosureRequired: boolean;
  allowedTopics: string[];
  preferredActions: string[];
};

const brandRoutes: Array<{ prefix: string; merchant: string; topics: string[] }> = [
  { prefix: "/affiliate-services/eurooptic", merchant: "EuroOptic", topics: ["optics", "outdoor gear", "watches", "navigation", "specialty gear"] },
  { prefix: "/affiliate-services/focus-camera", merchant: "Focus Camera", topics: ["cameras", "electronics", "navigation", "GPS", "creator gear"] },
  { prefix: "/affiliate-services/aquacurve", merchant: "AquaCurve", topics: ["poolside living", "outdoor furniture", "patio", "outdoor lifestyle"] },
  { prefix: "/affiliate-services/gearup", merchant: "GearUP", topics: ["gaming", "lag", "ping", "connection optimization", "mobile gaming"] },
  { prefix: "/affiliate-services/dhgate", merchant: "DHgate", topics: ["consumer tech", "creator tech", "travel tech", "accessories"] },
];

export function resolveAssistantPageContext(pathname?: string): AssistantPageContext {
  const path = pathname?.trim() || "/";

  if (path.startsWith("/owner-ai-studio")) {
    return {
      pathname: path,
      role: "owner-studio",
      mode: "owner",
      disclosureRequired: false,
      allowedTopics: ["social media content", "video scripts", "ad concepts", "content planning", "WASCIK projects"],
      preferredActions: ["draft content", "generate variations", "prepare media ideas"],
    };
  }

  const brand = brandRoutes.find((item) => path.startsWith(item.prefix));
  if (brand) {
    return {
      pathname: path,
      role: "affiliate-brand",
      merchant: brand.merchant,
      mode: "shopping",
      disclosureRequired: true,
      allowedTopics: brand.topics,
      preferredActions: ["recommend relevant products", "compare listed products", "open tracked affiliate link"],
    };
  }

  if (path.startsWith("/affiliate-services")) {
    return {
      pathname: path,
      role: "affiliate-hub",
      mode: "shopping",
      disclosureRequired: true,
      allowedTopics: ["affiliate brands", "product discovery", "product comparison", "shopping guidance"],
      preferredActions: ["identify shopper need", "recommend across brands", "send shopper to relevant affiliate page"],
    };
  }

  // Portfolio/service pages plus the dedicated AI-funnel test surfaces must run
  // the same service lead-qualification and Stage 6 persistence flow.
  if (
    path === "/" ||
    path.startsWith("/start-project") ||
    path.startsWith("/sample-project") ||
    path.startsWith("/ai-funnel/widget-preview") ||
    path.startsWith("/ai-funnel/live")
  ) {
    return {
      pathname: path,
      role: "portfolio",
      mode: "services",
      disclosureRequired: false,
      allowedTopics: ["websites", "mobile apps", "AI automation", "business technology", "WASCIK services"],
      preferredActions: ["explain services", "qualify project", "start project inquiry", "handoff to WASCIK"],
    };
  }

  return {
    pathname: path,
    role: "general",
    mode: "general",
    disclosureRequired: false,
    allowedTopics: ["WASCIK website navigation", "general assistance"],
    preferredActions: ["answer page-relevant questions", "guide visitor to the correct section"],
  };
}
