export type PlanItem = {
  family_id: string | null;
  item_key: string;
  month: string;
  period: number;
  subject: string;
  text: string;
  source: "national" | "typical" | "parent";
  done: boolean;
  hidden: boolean;
};

export type SkillSeed = {
  skill_key: string;
  area: string;
  title_fr: string;
  explanation_en: string;
  ask_fr: string;
  sort: number;
};

export const SKILLS: SkillSeed[] = [
  { skill_key: "reading", area: "Français", title_fr: "Lire un court texte", explanation_en: "She reads a few sentences aloud.", ask_fr: "Tu lis cette phrase ?", sort: 1 },
  { skill_key: "dictation", area: "Français", title_fr: "Ecrire une phrase", explanation_en: "She writes a short sentence she hears.", ask_fr: "Tu écris ce que tu entends ?", sort: 2 },
  { skill_key: "grammar", area: "Français", title_fr: "Nom et verbe", explanation_en: "She can point to a noun and a verb.", ask_fr: "Où est le verbe ?", sort: 3 },
  { skill_key: "spelling", area: "Français", title_fr: "Les sons fréquents", explanation_en: "She spells a few common sounds.", ask_fr: "Comment tu écris ce son ?", sort: 4 },
  { skill_key: "writing", area: "Français", title_fr: "Deux phrases", explanation_en: "She writes two sentences about a picture.", ask_fr: "Tu racontes l'image ?", sort: 5 },
  { skill_key: "poetry", area: "Français", title_fr: "Une petite poésie", explanation_en: "She learns a short poem.", ask_fr: "Tu dis le premier vers ?", sort: 6 },
  { skill_key: "numbers", area: "Mathématiques", title_fr: "Les nombres jusqu'à 1000", explanation_en: "She reads and writes numbers up to 1000.", ask_fr: "Quel nombre est le plus grand ?", sort: 7 },
  { skill_key: "tables", area: "Mathématiques", title_fr: "Les tables de 2, 5 et 10", explanation_en: "She practices the tables set by a parent.", ask_fr: "Combien font 2 fois 5 ?", sort: 8 },
  { skill_key: "add", area: "Mathématiques", title_fr: "Ajouter et retrancher", explanation_en: "She adds and subtracts within 100.", ask_fr: "Combien font 20 et 4 ?", sort: 9 },
  { skill_key: "fractions", area: "Mathématiques", title_fr: "Moitié et quart", explanation_en: "She uses halves and quarters.", ask_fr: "Montre-moi la moitié.", sort: 10 },
  { skill_key: "measure", area: "Mathématiques", title_fr: "Mesurer en centimètres", explanation_en: "She measures a length.", ask_fr: "C'est long de combien ?", sort: 11 },
  { skill_key: "money", area: "Mathématiques", title_fr: "Les pièces", explanation_en: "She knows a few coins and a simple price.", ask_fr: "Ça coûte combien ?", sort: 12 },
  { skill_key: "problem", area: "Mathématiques", title_fr: "Un petit problème", explanation_en: "She solves a short problem in steps.", ask_fr: "Que fait-on en premier ?", sort: 13 },
  { skill_key: "time", area: "Questionner le monde", title_fr: "Le temps qui passe", explanation_en: "She knows days, months, and the clock.", ask_fr: "On est quel jour ?", sort: 14 },
  { skill_key: "living", area: "Questionner le monde", title_fr: "Le vivant", explanation_en: "She can say what a plant needs.", ask_fr: "De quoi a besoin une plante ?", sort: 15 },
  { skill_key: "space", area: "Questionner le monde", title_fr: "Un petit plan", explanation_en: "She reads a very simple map.", ask_fr: "Où est la porte ?", sort: 16 },
  { skill_key: "matter", area: "Questionner le monde", title_fr: "Solide et liquide", explanation_en: "She sorts solid and liquid.", ask_fr: "L'eau est solide ou liquide ?", sort: 17 },
  { skill_key: "vocabulary", area: "Langue vivante", title_fr: "Quelques mots", explanation_en: "She knows a few everyday words.", ask_fr: "Comment tu dis chat ?", sort: 18 },
  { skill_key: "music", area: "Langue vivante", title_fr: "Une chanson courte", explanation_en: "She follows a short song.", ask_fr: "Tu chantes le début ?", sort: 19 },
  { skill_key: "rules", area: "EMC", title_fr: "Les règles du groupe", explanation_en: "She can name a class rule.", ask_fr: "Quelle est la règle ?", sort: 20 },
  { skill_key: "feelings", area: "EMC", title_fr: "Dire un sentiment", explanation_en: "She names a feeling.", ask_fr: "Comment tu te sens ?", sort: 21 },
  { skill_key: "together", area: "EMC", title_fr: "Aider un ami", explanation_en: "She talks about helping a friend.", ask_fr: "Comment on aide un ami ?", sort: 22 },
  { skill_key: "calendar", area: "Questionner le monde", title_fr: "La date", explanation_en: "She can say today's date.", ask_fr: "On est quel mois ?", sort: 23 },
];

type SeedPlan = Omit<PlanItem, "family_id" | "done" | "hidden">;

export const PLAN: SeedPlan[] = [
  { item_key: "eval-sep", month: "2026-09", period: 1, subject: "Maths", text: "National check: numbers and reading at the start of the year.", source: "national" },
  { item_key: "read-sep", month: "2026-09", period: 1, subject: "Français", text: "Read a short text and talk about it.", source: "typical" },
  { item_key: "toussaint", month: "2026-10", period: 1, subject: "Calendar", text: "Toussaint break. A light week is enough.", source: "national" },
  { item_key: "numbers-oct", month: "2026-10", period: 1, subject: "Maths", text: "Read numbers up to 100.", source: "typical" },
  { item_key: "times-2", month: "2026-11", period: 2, subject: "Maths", text: "National marker: the table of 2 starts in period 2.", source: "national" },
  { item_key: "sentence-nov", month: "2026-11", period: 2, subject: "Français", text: "Write one sentence with a capital and a full stop.", source: "typical" },
  { item_key: "christmas", month: "2026-12", period: 2, subject: "Calendar", text: "Christmas break starts late in the month.", source: "national" },
  { item_key: "story-dec", month: "2026-12", period: 2, subject: "Français", text: "Listen to a short story and retell it.", source: "typical" },
  { item_key: "times-more", month: "2027-01", period: 3, subject: "Maths", text: "National marker: tables of 10, 3, 4 and 5 by period 3.", source: "national" },
  { item_key: "thousand", month: "2027-01", period: 3, subject: "Maths", text: "Numbers toward 1000.", source: "typical" },
  { item_key: "winter", month: "2027-02", period: 3, subject: "Calendar", text: "Winter break follows the family zone.", source: "national" },
  { item_key: "half", month: "2027-02", period: 3, subject: "Maths", text: "Halves of a shape and a number.", source: "typical" },
  { item_key: "easter", month: "2027-03", period: 4, subject: "Calendar", text: "Easter Monday is a school holiday.", source: "national" },
  { item_key: "measure-mar", month: "2027-03", period: 4, subject: "Maths", text: "Measure a length in centimetres.", source: "typical" },
  { item_key: "plant-apr", month: "2027-04", period: 4, subject: "Monde", text: "What a plant needs to grow.", source: "typical" },
  { item_key: "dictation-apr", month: "2027-04", period: 4, subject: "Français", text: "A short dictation of familiar words.", source: "typical" },
  { item_key: "pentecost", month: "2027-05", period: 5, subject: "Calendar", text: "Pentecost Monday is a school holiday.", source: "national" },
  { item_key: "map-may", month: "2027-05", period: 5, subject: "Monde", text: "Read a simple plan of a room.", source: "typical" },
  { item_key: "year-end", month: "2027-06", period: 5, subject: "Calendar", text: "The school year ends in early July.", source: "national" },
  { item_key: "review-jun", month: "2027-06", period: 5, subject: "Français", text: "Review a story, a table, and a number.", source: "typical" },
];

export function monthKey(date: Date, timeZone = "Europe/Paris") {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).format(date).slice(0, 7);
}

export function nextMonthKey(month: string) {
  const [year, part] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, part, 1));
  return date.toISOString().slice(0, 7);
}

export function monthPlan(rows: PlanItem[], month: string) {
  const inMonth = rows.filter((row) => row.month === month);
  const family = inMonth.filter((row) => row.family_id);
  const keys = new Set(family.map((row) => row.item_key));
  return [...family, ...inMonth.filter((row) => !row.family_id && !keys.has(row.item_key))]
    .filter((row) => !row.hidden)
    .sort((a, b) => a.subject.localeCompare(b.subject) || a.item_key.localeCompare(b.item_key));
}

export function skillStatus(level: number) {
  if (level >= 3) return "strong" as const;
  if (level >= 1) return "practicing" as const;
  return "not started" as const;
}

export function nextLevel(previous: number, earned: number) {
  const prior = Number.isFinite(previous) ? previous : 0;
  const next = Number.isFinite(earned) ? earned : 0;
  return Math.max(0, prior, next);
}

export function weekCounts(games: string[]) {
  let play = 0;
  let logic = 0;
  for (const game of games) {
    if (game.startsWith("lagoon")) logic += 1;
    else if (game === "bulles" || game === "fruit" || game === "kitchen" || game === "safari") play += 1;
  }
  return { games: play, logic };
}
