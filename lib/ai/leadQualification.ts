export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export type LeadProfile = {
  name?: string;
  email?: string;
  phone?: string;
  business?: string;
  projectType?: string;
  goals?: string[];
  features?: string[];
  budget?: string;
  timeline?: string;
};

export type LeadQualification = {
  profile: LeadProfile;
  score: number;
  status: "discovery" | "qualifying" | "handoff-ready";
  missingFields: string[];
  nextQuestion?: string;
};

function firstMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1]?.trim();
}

function cleanBusiness(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/\s+(?:and|but)\s+i\s+(?:need|want|am looking|would like)\b.*$/i, "")
    .replace(/\s+(?:because|so)\s+i\b.*$/i, "")
    .trim()
    .slice(0, 80) || undefined;
}

function extractBudget(userMessages: string[]) {
  for (const message of userMessages) {
    const amountNearBudget = message.match(/(?:about|around|roughly|up to|under|over)?\s*(\$\s?\d[\d,]*(?:\.\d{1,2})?)\s*(?:budget)?/i)?.[1];
    if (amountNearBudget && /budget|spend|afford|pay|cost/i.test(message)) return amountNearBudget.replace(/\s+/g, "");

    const budgetPhrase = firstMatch(message, /(?:my\s+)?budget(?:\s+is|\s+is about|\s+is around|\s+of)?[ \t]+([^\n,.!?]{1,60})/i);
    if (budgetPhrase) return budgetPhrase;

    const spendPhrase = firstMatch(message, /(?:looking to spend|can spend|could spend|want to spend|spending)[ \t]+([^\n,.!?]{1,60})/i);
    if (spendPhrase) return spendPhrase;
  }
  return undefined;
}

function extractTimeline(userMessages: string[]) {
  for (const message of userMessages) {
    const direct = firstMatch(message, /(?:need it|want it|would like it|launch|ready|timeline|deadline)(?:\s+by|\s+in|\s+is|\s+around|\s+as)?[ \t]+([^\n,.!?]{2,70})/i);
    if (direct) return direct;

    const asap = message.match(/\b(as soon as possible(?:[^\n,.!?]{0,45})?|asap(?:[^\n,.!?]{0,45})?)\b/i)?.[1]?.trim();
    if (asap) return asap;

    const duration = message.match(/\b((?:about|around|maybe|within|in)?\s*(?:a\s+)?(?:week|two weeks|\d+\s*(?:day|days|week|weeks|month|months))(?:\s+or\s+two)?[^\n,.!?]{0,20})\b/i)?.[1]?.trim();
    if (duration && /week|day|month/i.test(duration)) return duration;
  }
  return undefined;
}

function mergeFeatures(existing: string[] | undefined, userText: string) {
  const known = new Set(existing ?? []);
  const featureTerms: Array<[string, RegExp]> = [
    ["menu", /\bmenu\b/i],
    ["photos", /\bphotos?|images?\b/i],
    ["logo", /\blogo\b/i],
    ["hosting", /\bhosting\b/i],
    ["domain", /\bdomain\b/i],
    ["reservations", /\breservations?\b/i],
    ["online ordering", /\bonline ordering\b/i],
    ["gallery", /\bgallery\b/i],
    ["contact page", /\bcontact page\b/i],
  ];
  for (const [label, pattern] of featureTerms) if (pattern.test(userText)) known.add(label);
  return [...known];
}

export function qualifyLead(turns: ConversationTurn[], existing: LeadProfile = {}): LeadQualification {
  const userMessages = turns.filter((turn) => turn.role === "user").map((turn) => turn.content);
  const userText = userMessages.join("\n");
  const lower = userText.toLowerCase();
  const profile: LeadProfile = { ...existing };

  profile.email ||= userText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  profile.phone ||= userText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];
  profile.name ||= firstMatch(userText, /(?:my name is|i(?:'m| am) called|this is)\s+([a-z][a-z .'-]{1,35}?)(?=\s+(?:and\s+i\b|and\s+we\b)|[,.!?\n]|$)/i);

  if (!profile.business) {
    profile.business = cleanBusiness(firstMatch(userText, /(?:my business is|my company is|company is|business called|i own|i run|i have)\s+([^\n,.!?]{2,100})/i));
  }
  if (!profile.business) {
    const category = firstMatch(userText, /(?:for|with)\s+(?:my|our|a|an)\s+([a-z][a-z &'/-]{2,60}?)(?=\s+(?:business|company|practice|store|shop|restaurant|service)\b|[,.!?\n]|$)/i);
    if (category) profile.business = cleanBusiness(category);
  }
  if (!profile.business && /\brestaurant\b/i.test(userText)) profile.business = "restaurant";

  profile.budget ||= extractBudget(userMessages);
  profile.timeline ||= extractTimeline(userMessages);
  profile.features = mergeFeatures(profile.features, userText);

  if (!profile.projectType) {
    const projectTypes = [
      ["website", ["website", "web site", "landing page"]],
      ["mobile app", ["mobile app", "ios app", "android app", "app"]],
      ["AI automation", ["ai assistant", "automation", "ai system", "chatbot"]],
      ["e-commerce", ["ecommerce", "e-commerce", "online store", "shop"]],
    ] as const;
    profile.projectType = projectTypes.find(([, terms]) => terms.some((term) => lower.includes(term)))?.[0];
  }

  const missingFields: string[] = [];
  if (!profile.projectType) missingFields.push("projectType");
  if (!profile.business) missingFields.push("business");
  if (!profile.email && !profile.phone) missingFields.push("contact");

  const coreKnown = 3 - missingFields.length;
  let score = coreKnown * 25;
  if (profile.budget) score += 10;
  if (profile.timeline) score += 10;
  if (profile.name) score += 5;
  score = Math.max(0, Math.min(100, score));

  const status: LeadQualification["status"] = missingFields.length === 0 ? "handoff-ready" : coreKnown >= 1 ? "qualifying" : "discovery";
  const questions: Record<string, string> = {
    projectType: "What would you like WASCIK to build for you — a website, app, AI automation, online store, or something else?",
    business: "What kind of business or project is this for?",
    contact: "If you'd like WASCIK to follow up, what email address or phone number should we use?",
  };

  return { profile, score, status, missingFields, nextQuestion: missingFields[0] ? questions[missingFields[0]] : undefined };
}
