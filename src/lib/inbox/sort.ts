export type Tier = "urgent" | "important" | "fyi";

const URGENT = /autoris|permission|paiement|payment|r[eè]glement|ch[eè]que|pickup|r[eé]cup[eé]r|venir chercher|malade|sickness|\bsick\b|absence/i;
const SOON = /aujourd|ce soir|demain|tomorrow|today/i;
const IMPORTANT = /devoir|homework|contr[oô]le|examen|\btest\b|[eé]valuation|r[eé]union|meeting|sortie|voyage|\btrip\b|excursion/i;
const FYI = /menu|cantine|newsletter|bulletin|information/i;

export type RuleHit = {
  tier: Tier;
  confidence: number;
  actionRequired: boolean;
};

export function classifyByRules(text: string, options?: { senderTier?: Tier | null; now?: Date; dueAt?: Date | null }): RuleHit {
  if (options?.senderTier) return { tier: options.senderTier, confidence: 1, actionRequired: options.senderTier === "urgent" };
  const dueSoon = options?.dueAt ? options.dueAt.getTime() - (options.now ?? new Date()).getTime() <= 48 * 60 * 60 * 1000 && options.dueAt.getTime() >= (options.now ?? new Date()).getTime() - 60 * 60 * 1000 : false;
  if (dueSoon || SOON.test(text) || URGENT.test(text)) {
    return { tier: "urgent", confidence: 0.86, actionRequired: URGENT.test(text) || dueSoon };
  }
  if (IMPORTANT.test(text)) return { tier: "important", confidence: 0.8, actionRequired: false };
  if (FYI.test(text)) return { tier: "fyi", confidence: 0.78, actionRequired: false };
  return { tier: "important", confidence: 0.4, actionRequired: false };
}

export function chooseTier(rules: RuleHit, model?: { tier?: Tier | null; confidence?: number | null }) {
  let tier = rules.tier;
  let confidence = rules.confidence;
  if (rules.confidence < 0.6 && model?.tier) {
    tier = model.tier;
    if (typeof model.confidence === "number") confidence = model.confidence;
  }
  if (confidence < 0.6) {
    return { tier: bump(tier), confidence, pleaseCheck: true, actionRequired: rules.actionRequired };
  }
  return { tier, confidence, pleaseCheck: false, actionRequired: rules.actionRequired };
}

export function canArchive(parentCount: number, tickedCount: number) {
  return parentCount > 0 && tickedCount >= parentCount;
}

export function canUndo(myTicked: boolean, otherParentTicked: boolean) {
  return myTicked && !otherParentTicked;
}

export function escalationTargets(input: {
  tier: string | null;
  status: string;
  createdAt: string;
  now: string;
  parents: { id: string; ticked: boolean }[];
  alreadySent: string[];
}) {
  if (input.tier !== "urgent" || input.status === "archived") return [];
  if (Date.parse(input.now) - Date.parse(input.createdAt) < 2 * 60 * 60 * 1000) return [];
  return input.parents.filter((parent) => !parent.ticked && !input.alreadySent.includes(parent.id)).map((parent) => parent.id);
}

export function digestKind(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23", weekday: "short" }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  if (hour === 19) return "important" as const;
  if (weekday === "Sun" && hour === 18) return "fyi" as const;
  return null;
}

function bump(tier: Tier): Tier {
  if (tier === "fyi") return "important";
  if (tier === "important") return "urgent";
  return "urgent";
}
