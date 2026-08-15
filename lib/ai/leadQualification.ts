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

export function qualifyLead(turns: ConversationTurn[], existing: LeadProfile = {}): LeadQualification {
  const userText = turns.filter((turn) => turn.role === "user").map((turn) => turn.content).join("\n");
  const lower = userText.toLowerCase();
  const profile: LeadProfile = { ...existing };

  profile.email ||= userText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  profile.phone ||= userText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];
  profile.name ||= firstMatch(userText, /(?:my name is|i(?:'m| am) called|this is)\s+([a-z][a-z .'-]{1,50})/i);
  profile.business ||= firstMatch(userText, /(?:my business is|company is|business called|i own|i run)\s+([^\n,.!?]{2,80})/i);
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
  if (!profile.budget) missingFields.push("budget");
  if (!profile.timeline) missingFields.push("timeline");
  if (!profile.email && !profile.phone) missingFields.push("contact");

  const known = 5 - missingFields.length;
  const score = Math.max(0, Math.min(100, known * 20));
  const status: LeadQualification["status"] = score >= 80 ? "handoff-ready" : score >= 40 ? "qualifying" : "discovery";

  const questions: Record<string, string> = {
    projectType: "What would you like WASCIK to build for you — a website, app, AI automation, online store, or something else?",
    business: "What kind of business or project is this for?",
    budget: "Do you have an approximate budget range in mind?",
    timeline: "When would you ideally like this project ready?",
    contact: "What email address or phone number should WASCIK use to follow up with you?",
  };

  return {
    profile,
    score,
    status,
    missingFields,
    nextQuestion: missingFields[0] ? questions[missingFields[0]] : undefined,
  };
}
