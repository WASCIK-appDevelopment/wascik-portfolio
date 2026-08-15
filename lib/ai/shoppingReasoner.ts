import { getAffiliateCatalog } from "./affiliateCatalog";

const intentExpansions: Record<string, string[]> = {
  security: ["security", "doorbell", "lock", "camera", "smart home", "entry", "visitor", "motion"],
  creator: ["creator", "podcast", "stream", "audio", "mixer", "record", "microphone", "video"],
  travel: ["travel", "translator", "language", "portable", "trip"],
  recovery: ["recovery", "massage", "muscle", "joint", "cupping", "heat", "vibration"],
  skincare: ["skincare", "face", "facial", "collagen", "beauty", "led"],
  fitness: ["fitness", "workout", "exercise", "vibration", "platform"],
  outdoor: ["outdoor", "hunting", "optics", "watch", "watches", "gear", "specialty", "adventure"],
  navigation: ["navigation", "gps", "truck", "driver", "driving", "dash camera", "road"],
  gaming: ["gaming", "game", "lag", "ping", "latency", "server", "mobile", "booster"],
  poolside: ["poolside", "pool", "patio", "outdoor living", "furniture", "leisure"],
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function queryTerms(query: string) {
  const normalized = normalize(query);
  const base = normalized.split(" ").filter((term) => term.length > 2);
  const expanded = new Set(base);

  for (const [intent, words] of Object.entries(intentExpansions)) {
    if (base.includes(intent) || words.some((word) => normalized.includes(word))) {
      words.forEach((word) => expanded.add(word));
    }
  }

  return [...expanded];
}

export function recommendAffiliateProducts(query: string, merchant?: string, limit = 3) {
  const terms = queryTerms(query);
  const catalog = getAffiliateCatalog(merchant);

  const ranked = catalog.map((product) => {
    const title = normalize(product.title);
    const category = normalize(product.category);
    const description = normalize(product.description);
    const features = normalize(product.features.join(" "));

    let score = 0;
    const reasons: string[] = [];

    for (const term of terms) {
      if (title.includes(term)) score += 5;
      if (category.includes(term)) score += 4;
      if (features.includes(term)) score += 3;
      if (description.includes(term)) score += 2;
    }

    if (score > 0) {
      const matchedFeature = product.features.find((feature) =>
        terms.some((term) => normalize(feature).includes(term))
      );
      reasons.push(matchedFeature ?? product.category);
    }

    return { product, score, reasons };
  });

  const matches = ranked
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 5)));

  // Never substitute unrelated products when the query has no real catalog match.
  // The route will return a clear no-match message instead.
  return matches.map(({ product, score, reasons }) => ({
    id: product.id,
    merchant: product.merchant,
    title: product.title,
    category: product.category,
    description: product.description,
    features: product.features,
    affiliateUrl: product.affiliateUrl,
    pagePath: product.pagePath,
    source: product.source,
    score,
    reason: reasons[0],
  }));
}
