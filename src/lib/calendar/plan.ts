export const SNOOZE_MINUTES = [30, 45, 60] as const;

export const BREAK_PRACTICE = [
  "Stories and reading phrases",
  "Counting game",
  "Tables game",
  "Dictation words",
  "Family game and Logic Lagoon",
] as const;

const DAY = 24 * 60;

export const NATIONAL_HOLIDAYS = [
  { kind: "holiday", starts_on: "2026-10-17", ends_on: "2026-11-01", label: "Toussaint break", source: "national", zone: null },
  { kind: "event", starts_on: "2026-11-02", ends_on: "2026-11-02", label: "Back to school", source: "national", zone: null },
  { kind: "holiday", starts_on: "2026-11-11", ends_on: "2026-11-11", label: "Armistice", source: "national", zone: null },
  { kind: "holiday", starts_on: "2026-12-19", ends_on: "2027-01-03", label: "Christmas break", source: "national", zone: null },
  { kind: "event", starts_on: "2027-01-04", ends_on: "2027-01-04", label: "Back to school", source: "national", zone: null },
  { kind: "holiday", starts_on: "2027-02-13", ends_on: "2027-03-01", label: "Winter break", source: "national", zone: "A" },
  { kind: "holiday", starts_on: "2027-02-20", ends_on: "2027-03-08", label: "Winter break", source: "national", zone: "B" },
  { kind: "holiday", starts_on: "2027-02-06", ends_on: "2027-02-22", label: "Winter break", source: "national", zone: "C" },
  { kind: "holiday", starts_on: "2027-03-29", ends_on: "2027-03-29", label: "Easter Monday", source: "national", zone: null },
  { kind: "holiday", starts_on: "2027-05-17", ends_on: "2027-05-17", label: "Pentecost Monday", source: "national", zone: null },
  { kind: "event", starts_on: "2027-07-03", ends_on: "2027-07-03", label: "School year ends", source: "national", zone: null },
] as const;

export type Holiday = {
  family_id: string | null;
  label: string;
  starts_on: string;
  ends_on: string;
  zone: string | null;
  kind: string;
};

export function offsetsForChoice(choice: string, startsAt: Date, now: Date, timeZone = "Europe/Paris") {
  if (choice === "week") return [8 * DAY, DAY];
  if (choice === "day") return [DAY];
  if (choice === "morning") {
    const morning = minutesUntilMorning(startsAt, timeZone);
    return [morning >= 30 ? morning : 60];
  }
  return defaultOffsets(startsAt, now, timeZone);
}

export function eventMark(title: string, fromMessage: boolean) {
  if (title.startsWith("📝 ")) return "homework" as const;
  if (title.startsWith("🏫 ") || fromMessage) return "school" as const;
  return "family" as const;
}

export function displayTitle(title: string) {
  return title.replace(/^(📝|🏫) /, "");
}

export function titledEvent(title: string, type: string) {
  const clean = displayTitle(title);
  if (type === "homework") return `📝 ${clean}`;
  if (type === "school") return `🏫 ${clean}`;
  return clean;
}

export function defaultOffsets(startsAt: Date, now: Date, timeZone = "Europe/Paris") {
  const ahead = (startsAt.getTime() - now.getTime()) / 60000;
  if (ahead > 7 * DAY) return [8 * DAY, DAY];
  const morning = minutesUntilMorning(startsAt, timeZone);
  if (morning >= 30) return [morning];
  return [Math.min(60, Math.max(15, Math.floor(Math.max(ahead, 15))))];
}

export function reminderInstants(startsAt: Date, offsets: number[], now: Date) {
  return offsets
    .map((minutes) => new Date(startsAt.getTime() - minutes * 60000))
    .filter((instant) => instant.getTime() > now.getTime() - 60000);
}

export function applySnooze(input: { dueAt: Date; snoozeCount: number; minutes: number; timeZone?: string }) {
  const timeZone = input.timeZone ?? "Europe/Paris";
  if (input.snoozeCount >= 3) {
    return {
      dueAt: nextMorning(input.dueAt, timeZone),
      snoozeCount: input.snoozeCount + 1,
      note: "Moved to tomorrow after 3 snoozes",
      status: "pending" as const,
    };
  }
  const minutes = Math.min(DAY, Math.max(1, Math.floor(input.minutes)));
  return {
    dueAt: new Date(input.dueAt.getTime() + minutes * 60000),
    snoozeCount: input.snoozeCount + 1,
    note: null as string | null,
    status: "pending" as const,
  };
}

export function shouldNotifyOther(input: { status: string; dueAt: string; escalated: boolean; target: string }, now: Date) {
  if (input.target !== "parent" || input.escalated || input.status !== "sent") return false;
  return now.getTime() - Date.parse(input.dueAt) >= 20 * 60 * 1000;
}

export function parseReminderAction(data: string) {
  const match = /^r:([0-9a-f-]{36}):(done|30|45|60)$/i.exec(data.trim());
  if (!match) return null;
  const action = match[2].toLowerCase();
  return { id: match[1], action: action as "done" | "30" | "45" | "60" };
}

export function visibleHolidays(rows: Holiday[], zone: string) {
  const own = rows.filter((row) => row.family_id && (!row.zone || row.zone === zone));
  const labels = new Set(own.map((row) => row.label));
  const shared = rows.filter((row) => !row.family_id && !labels.has(row.label) && (!row.zone || row.zone === zone));
  return [...own, ...shared];
}

export function holidayOn(day: string, rows: Holiday[], zone: string) {
  return visibleHolidays(rows, zone).find((row) => row.kind === "holiday" && row.starts_on <= day && day <= row.ends_on) ?? null;
}

export function schoolZone(settings: { school_zone?: string } | null | undefined) {
  return settings?.school_zone === "B" || settings?.school_zone === "C" ? settings.school_zone : "A";
}

export function holidayDates(days: string[], rows: Holiday[], zone: string) {
  return days.filter((day) => holidayOn(day, rows, zone));
}

export function weekdayDates(start: string, end: string) {
  const days: string[] = [];
  const cursor = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  while (cursor <= last && days.length < 10) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function parseLocalDateTime(value: string, timeZone = "Europe/Paris") {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return atLocalTime(match[1], Number(match[2]), Number(match[3]), timeZone);
}

export function dayKey(date: Date, timeZone = "Europe/Paris") {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function monthCells(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthNumber - 1, 1));
  const start = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells: ({ day: string } | null)[] = Array.from({ length: start }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push({ day: `${month}-${String(day).padStart(2, "0")}` });
  }
  return cells;
}

export function icsCalendar(events: { uid: string; title: string; startsAt: string; endsAt?: string | null; allDay?: boolean }[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mochi and Friends//EN", "CALSCALE:GREGORIAN"];
  for (const event of events) {
    lines.push("BEGIN:VEVENT", `UID:${event.uid}`, `DTSTAMP:${stamp(new Date())}`, `SUMMARY:${escapeIcs(event.title)}`);
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${event.startsAt.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${event.endsAt?.replaceAll("-", "") ?? event.startsAt.replaceAll("-", "")}`);
    } else {
      lines.push(`DTSTART:${stamp(new Date(event.startsAt))}`);
      if (event.endsAt) lines.push(`DTEND:${stamp(new Date(event.endsAt))}`);
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function nextMorning(from: Date, timeZone = "Europe/Paris") {
  const today = dayKey(from, timeZone);
  for (let hour = 1; hour <= 48; hour += 1) {
    const candidate = new Date(from.getTime() + hour * 60 * 60 * 1000);
    const parts = localParts(candidate, timeZone);
    if (parts.hour === 8 && dayKey(candidate, timeZone) !== today) {
      return atLocalTime(dayKey(candidate, timeZone), 8, 0, timeZone);
    }
  }
  return new Date(from.getTime() + DAY * 60000);
}

function minutesUntilMorning(startsAt: Date, timeZone: string) {
  const parts = localParts(startsAt, timeZone);
  return parts.hour * 60 + parts.minute - 8 * 60;
}

export function atLocalTime(day: string, hour: number, minute: number, timeZone: string) {
  const guess = new Date(`${day}T${pad(hour)}:${pad(minute)}:00Z`);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const local = localParts(guess, timeZone);
    const delta = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute) - Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), hour, minute);
    if (delta === 0) return guess;
    guess.setTime(guess.getTime() - delta);
  }
  return guess;
}

function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute") };
}

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
