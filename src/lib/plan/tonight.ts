export type Duty = "off" | "flying" | "standby" | "layover";

export type PlannerParent = {
  id: string;
  name: string;
  role: "mom" | "dad";
  duty: Duty | null;
  freeFrom: string | null;
  freeTo: string | null;
};

export type TonightInput = {
  date: string;
  capMinutes: number;
  windowFrom: string;
  windowTo: string;
  parents: PlannerParent[];
  preferId?: string | null;
};

export type TonightPlan = {
  leaderId: string | null;
  leaderName: string;
  role: "mom" | "dad" | "solo";
  start: string;
  duration: number;
  voiceNote: boolean;
  questions: [string, string, string];
};

const QUESTIONS = ["What did she understand?", "Where did she get stuck?", "What is one thing to try tomorrow?"] as const;

export function planTonight(input: TonightInput): TonightPlan {
  const cap = Math.max(1, Math.min(60, Math.floor(input.capMinutes)));
  const eligible = input.parents.filter((parent) => canLead(parent, input.windowFrom, input.windowTo));
  const preferred = input.preferId ? eligible.find((parent) => parent.id === input.preferId) : undefined;
  const leader = preferred ?? pickRotated(eligible, input.date);
  if (!leader) {
    return {
      leaderId: null,
      leaderName: "Yana",
      role: "solo",
      start: input.windowFrom,
      duration: Math.min(5, cap),
      voiceNote: true,
      questions: [...QUESTIONS],
    };
  }
  const from = leader.freeFrom ?? input.windowFrom;
  const to = leader.freeTo ?? input.windowTo;
  const overlap = overlapMinutes(from, to, input.windowFrom, input.windowTo);
  const roleMinutes = leader.role === "mom" ? 15 : 10;
  return {
    leaderId: leader.id,
    leaderName: leader.name,
    role: leader.role,
    start: laterTime(from, input.windowFrom),
    duration: Math.min(roleMinutes, cap, overlap),
    voiceNote: false,
    questions: [...QUESTIONS],
  };
}

export function isAway(duty: Duty | null) {
  return duty === "flying" || duty === "layover" || duty === "standby";
}

function canLead(parent: PlannerParent, windowFrom: string, windowTo: string) {
  if (isAway(parent.duty)) return false;
  const from = parent.freeFrom ?? windowFrom;
  const to = parent.freeTo ?? windowTo;
  return overlapMinutes(from, to, windowFrom, windowTo) >= 5;
}

function pickRotated(eligible: PlannerParent[], date: string) {
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];
  const day = Number(date.slice(8, 10));
  const mom = eligible.find((parent) => parent.role === "mom");
  const dad = eligible.find((parent) => parent.role === "dad");
  if (day % 2 === 0) return mom ?? eligible[0];
  return dad ?? eligible[0];
}

function overlapMinutes(from: string, to: string, windowFrom: string, windowTo: string) {
  const start = Math.max(minutes(from), minutes(windowFrom));
  const end = Math.min(minutes(to), minutes(windowTo));
  return Math.max(0, end - start);
}

function laterTime(from: string, windowFrom: string) {
  return minutes(from) >= minutes(windowFrom) ? from : windowFrom;
}

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
