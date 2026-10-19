import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applySnooze,
  defaultOffsets,
  displayTitle,
  eventMark,
  holidayOn,
  offsetsForChoice,
  icsCalendar,
  NATIONAL_HOLIDAYS,
  parseLocalDateTime,
  parseReminderAction,
  shouldNotifyOther,
  visibleHolidays,
  weekdayDates,
  type Holiday,
} from "@/lib/calendar/plan";

const paris = "Europe/Paris";
const toussaint: Holiday = {
  family_id: null,
  label: "Toussaint break",
  starts_on: "2026-10-17",
  ends_on: "2026-11-01",
  zone: null,
  kind: "holiday",
};

describe("school year dates", () => {
  it("includes the 2026-2027 national dates, with a winter break for each zone", () => {
    expect(NATIONAL_HOLIDAYS).toHaveLength(11);
    expect(NATIONAL_HOLIDAYS.find((row) => row.label === "Toussaint break")).toMatchObject({ starts_on: "2026-10-17", ends_on: "2026-11-01" });
    expect(NATIONAL_HOLIDAYS.filter((row) => row.label === "Winter break").map((row) => row.zone)).toEqual(["A", "B", "C"]);
    expect(NATIONAL_HOLIDAYS.find((row) => row.label === "School year ends")?.starts_on).toBe("2027-07-03");
  });

  it("loads calendar and skills without asking for a SQL paste", () => {
    const root = process.cwd();
    const calendar = readFileSync(path.join(root, "src/app/parent/(gate)/calendar/page.tsx"), "utf8");
    const progress = readFileSync(path.join(root, "src/app/parent/(gate)/progress/page.tsx"), "utf8");
    const status = readFileSync(path.join(root, "src/app/parent/(gate)/setup/status/page.tsx"), "utf8");
    expect(calendar).toContain("ensureHolidays");
    expect(progress).toContain("ensureOutline");
    for (const source of [calendar, progress, status]) {
      expect(source).not.toMatch(/SQL editor/);
      expect(source).not.toMatch(/Paste supabase/);
    }
    expect(status).toContain("0001 through 0011");
    expect(status).toContain("The tables this screen checks are present.");
  });
});

describe("calendar reminders", () => {
  it("uses the day before when the date is more than a week away, and the morning when it is sooner", () => {
    const now = new Date("2026-10-16T08:00:00.000Z");
    const later = parseLocalDateTime("2026-11-02T15:00", paris)!;
    expect(defaultOffsets(later, now, paris)).toEqual([8 * 24 * 60, 24 * 60]);
    const soon = parseLocalDateTime("2026-10-20T15:00", paris)!;
    expect(defaultOffsets(soon, now, paris)).toEqual([7 * 60]);
  });

  it("snoozes by the chosen minutes and moves to the next morning after the third snooze", () => {
    const due = new Date("2026-10-16T16:00:00.000Z");
    const first = applySnooze({ dueAt: due, snoozeCount: 0, minutes: 30, timeZone: paris });
    expect(first.dueAt.toISOString()).toBe("2026-10-16T16:30:00.000Z");
    expect(first.note).toBeNull();
    const moved = applySnooze({ dueAt: due, snoozeCount: 3, minutes: 30, timeZone: paris });
    expect(moved.note).toBe("Moved to tomorrow after 3 snoozes");
    expect(moved.dueAt.toISOString()).toBe("2026-10-17T06:00:00.000Z");
  });

  it("tells the other parent only after a sent reminder has waited 20 minutes", () => {
    const now = new Date("2026-10-16T16:20:00.000Z");
    expect(shouldNotifyOther({ status: "sent", dueAt: "2026-10-16T16:00:00.000Z", escalated: false, target: "parent" }, now)).toBe(true);
    expect(shouldNotifyOther({ status: "sent", dueAt: "2026-10-16T16:10:00.000Z", escalated: false, target: "parent" }, now)).toBe(false);
    expect(parseReminderAction("r:11111111-1111-1111-1111-111111111111:45")?.action).toBe("45");
  });

  it("shows the family holiday instead of the national date, and lists weekdays for a break", () => {
    const own: Holiday = { ...toussaint, family_id: "family", starts_on: "2026-10-18", ends_on: "2026-10-25" };
    expect(visibleHolidays([toussaint, own], "A").map((row) => row.starts_on)).toEqual(["2026-10-18"]);
    expect(holidayOn("2026-10-20", [toussaint], "A")?.label).toBe("Toussaint break");
    expect(weekdayDates("2026-10-17", "2026-10-20")).toEqual(["2026-10-19", "2026-10-20"]);
  });

  it("builds a calendar feed the parents can subscribe to", () => {
    const body = icsCalendar([{ uid: "1@mochi", title: "Meeting, school", startsAt: "2026-10-20T13:00:00.000Z" }]);
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("SUMMARY:Meeting\\, school");
    expect(body).toContain("DTSTART:20261020T130000Z");
  });

  it("keeps the reminder the parent chose, and marks school and homework events", () => {
    const soon = parseLocalDateTime("2026-10-20T15:00", paris)!;
    const now = new Date("2026-10-16T08:00:00.000Z");
    expect(offsetsForChoice("day", soon, now, paris)).toEqual([24 * 60]);
    expect(offsetsForChoice("morning", soon, now, paris)).toEqual([7 * 60]);
    expect(eventMark("📝 Tables", false)).toBe("homework");
    expect(eventMark("Picnic", true)).toBe("school");
    expect(displayTitle("🏫 Sortie")).toBe("Sortie");
  });
});
