import { holidayOn, visibleHolidays, type Holiday } from "@/lib/calendar/plan";

export type TodayBlock = "needs" | "tonight" | "homework" | "coming" | "break" | "week" | "rewards" | "recordings" | "setup";

export type WeekGlance = {
  homework: number;
  games: number;
  logic: number;
  voice: number;
  stories: number;
  studyMinutes: number;
  stars: number;
  hints: number;
  strong: number;
  practicing: number;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function sourceLabel(source: string) {
  if (source === "telegram") return "Telegram";
  if (source === "email") return "Email";
  return source || "Message";
}

export function tierLabel(tier: string) {
  if (tier === "urgent") return "Urgent";
  if (tier === "important") return "Important";
  return "FYI";
}

export function weekHasActivity(week: WeekGlance) {
  return week.homework + week.games + week.logic + week.voice + week.stories + week.studyMinutes + week.stars + week.hints + week.strong + week.practicing > 0;
}

export function togetherSuggestion(week: Pick<WeekGlance, "homework" | "stories" | "games">) {
  if (week.homework === 0) return "Sit with her for one homework page.";
  if (week.stories === 0) return "Read one short story together.";
  if (week.games === 0) return "Play one short game together.";
  return "Ask her one question from tonight's plan.";
}

export function visibleBlocks(input: {
  comingUp: number;
  breakBanner: boolean;
  week: boolean;
  rewards: number;
  recordings: number;
  setup: number;
}): TodayBlock[] {
  const blocks: TodayBlock[] = ["needs", "tonight", "homework"];
  if (input.comingUp > 0) blocks.push("coming");
  if (input.breakBanner) blocks.push("break");
  if (input.week) blocks.push("week");
  if (input.rewards > 0) blocks.push("rewards");
  if (input.recordings > 0) blocks.push("recordings");
  if (input.setup > 0) blocks.push("setup");
  return blocks;
}

export function noticeHoliday(day: string, rows: Holiday[], zone: string) {
  const current = holidayOn(day, rows, zone);
  if (current) return current;
  const upcoming = visibleHolidays(rows, zone)
    .filter((row) => row.kind === "holiday" && row.starts_on > day)
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0];
  if (!upcoming) return null;
  return schoolDaysBefore(upcoming.starts_on, 3).includes(day) ? upcoming : null;
}

export function breakBannerText(holiday: Holiday) {
  const back = addDays(holiday.ends_on, 1);
  return `${holiday.label}: back ${formatBack(back)}. Here is what to expect in ${monthName(back)}.`;
}

function schoolDaysBefore(start: string, count: number) {
  const days: string[] = [];
  let cursor = addDays(start, -1);
  while (days.length < count) {
    if (isSchoolDay(cursor)) days.push(cursor);
    cursor = addDays(cursor, -1);
  }
  return days;
}

function isSchoolDay(day: string) {
  const weekday = parseDay(day).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

function addDays(day: string, count: number) {
  const date = parseDay(day);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

function parseDay(day: string) {
  return new Date(`${day}T12:00:00Z`);
}

function formatBack(day: string) {
  const date = parseDay(day);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

function monthName(day: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(parseDay(day));
}
