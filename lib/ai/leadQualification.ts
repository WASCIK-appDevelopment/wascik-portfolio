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

export function qualifyLead(turns: ConversationTurn[], existing: LeadProfile = {}): LeadQualification {
  const userText = turns.filter((turn) => turn.role === "user").map((turn) => turn.content).join("\n");
  const lower = userText.toLowerCase();
  const profile: LeadProfile = { ...existing };

  profile.email ||= userText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  profile.phone ||= userText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];
  profile.name ||= firstMatch(userText, /(?:my name is|i(?:'m| am) called|this is)\s+([a-z][a-z .'-]{1,35}?)(?=\s+(?:and\s+i\b|and\s+we\b)|[,.!?\n]|$)/i);

  if (!profile.business) {
    profile.business = cleanBusiness(
      firstMatch(
        userText,
        /(?:my business is|my company is|company is|business called|i own|i run|i have)\s+([^\n,.!?]{2,100})/i
      )
    );
  }

  // If the visitor describes a business category instead of a company name, preserve that context.
  if (!profile.business) {
    const category = firstMatch(
      userText,
      /(?:for|with)\s+(?:my|our|a|an)\s+([a-z][a-z &'/-]{2,60}?)(?=\s+(?:business|company|practice|store|shop|restaurant|service)\b|[,.!?\n]|$)/i
    );
    if (category) profile.business = cleanBusiness(category);
  }

  profile.budget ||= firstMatch(userText, /(?:budget(?: is| around| about)?|spend(?:ing)?|looking to spend)\s*(?:of\s*)?([^\n,.!?]{1,60})/i);
  profile.timeline ||= firstMatch(userText, /(?:need it|launch|ready|timeline|deadline)(?: by| in| is| around)?\s+([^\n,.!?]{2,60})/i);

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

  const status: LeadQualification["status"] =
    missingFields.length === 0 ? "handoff-ready" : coreKnown >= 1 ? "qualifying" : "discovery";

  const questions: Record<string, string> = {
    projectType: "What would you like WASCIK to build for you — a website, app, AI automation, online store, or something else?",
    business: "What kind of business or project is this for?",
    contact: "If you'd like WASCIK to follow up, what email address or phone number should we use?",
  };

  return {
    profile,
    score,
    status,
    missingFields,
    nextQuestion: missingFields[0] ? questions[missingFields[0]] : undefined,
  };
}
