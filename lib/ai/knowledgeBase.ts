export type KnowledgeFact = {
  id: string;
  topics: string[];
  text: string;
};

export const wascikKnowledgeBase: KnowledgeFact[] = [
  {
    id: "company-services",
    topics: ["services", "websites", "apps", "ai", "automation", "ecommerce", "support", "ui", "ux"],
    text: "WASCIK App Development offers website development, mobile app development, AI and business automation, e-commerce solutions, UI/UX work, technology support, and affiliate shopping services.",
  },
  {
    id: "mission",
    topics: ["business", "local", "growth", "mission"],
    text: "WASCIK positions its services around helping businesses improve and grow their online presence with practical digital products and technology.",
  },
  {
    id: "website-pricing",
    topics: ["website", "pricing", "price", "cost", "page", "hosting", "maintenance", "domain"],
    text: "Current WASCIK website pricing: one-page promotional website $324 during the promotional period, then $399; additional pages $100 promotional, then $125; hosting/security $20 per month or $240 per year; domain $25 per year; maintenance $39.99 per month for the first year and $49.99 per month afterward. A $25 testimonial discount may be available under the current offer terms.",
  },
  {
    id: "affiliate-disclosure",
    topics: ["affiliate", "commission", "shopping", "products"],
    text: "WASCIK Affiliate Services may earn a commission when a shopper purchases through a tracked affiliate link, at no additional cost to the shopper.",
  },
  {
    id: "project-intake",
    topics: ["start", "project", "contact", "quote", "build"],
    text: "For a new WASCIK project, the representative should learn what the visitor wants to build, the business or use case, desired features, approximate timing, budget range if available, and contact details before handing the lead to the project-start/contact flow.",
  },
  {
    id: "ai-representative",
    topics: ["ai assistant", "representative", "avatar", "automation"],
    text: "WASCIK is developing page-aware AI website representatives that can answer approved business questions, guide shoppers, qualify leads, and hand visitors to the correct next step. The representative should not claim capabilities that are not yet deployed on the current page.",
  },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

export function retrieveWascikKnowledge(query: string, allowedTopics: string[] = [], limit = 5) {
  const haystack = normalize(`${query} ${allowedTopics.join(" ")}`);
  const words = new Set(haystack.split(/\s+/).filter((word) => word.length > 2));

  return wascikKnowledgeBase
    .map((fact) => {
      const topicScore = fact.topics.reduce((score, topic) => {
        const normalizedTopic = normalize(topic);
        return score + (haystack.includes(normalizedTopic) ? 4 : 0) + normalizedTopic.split(/\s+/).filter((word) => words.has(word)).length;
      }, 0);
      const textScore = normalize(fact.text).split(/\s+/).filter((word) => words.has(word)).length;
      return { fact, score: topicScore + textScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.fact);
}
