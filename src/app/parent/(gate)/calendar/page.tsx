import { createBreakPlan, saveHoliday, saveZone, snoozeReminder } from "@/app/parent/(gate)/calendar/actions";
import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { dayKey, holidayOn, monthCells, visibleHolidays, type Holiday } from "@/lib/calendar/plan";
import { getFamily } from "@/lib/family";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { supabase, family } = await getFamily();
  if (!family) return null;
  const timeZone = family.timezone || "Europe/Paris";
  const today = dayKey(new Date(), timeZone);
  const requested = (await searchParams).month ?? today.slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(requested) ? requested : today.slice(0, 7);
  const [{ data: events }, { data: reminders }, { data: roster }, { data: holidayRows, error: holidayError }, { data: familyRow, error: familyError }] = await Promise.all([
    supabase.from("events").select("id, title, starts_at").eq("family_id", family.family_id).order("starts_at"),
    supabase.from("reminders").select("id, due_at, status, note, escalated, target, ref_type, ref_id").neq("status", "done").order("due_at").limit(12),
    supabase.from("roster_days").select("date, status").eq("family_id", family.family_id),
    supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind"),
    supabase.from("families").select("ics_token, settings").eq("id", family.family_id).single(),
  ]);
  if (holidayError || familyError) {
    return <ParentNote title="Calendar" body="Apply supabase/migrations/0006_calendar.sql in the Supabase SQL editor, then reload this page." />;
  }

  const zone = (familyRow?.settings as { school_zone?: string } | null)?.school_zone;
  const schoolZone = zone === "B" || zone === "C" ? zone : "A";
  const holidays = visibleHolidays((holidayRows ?? []) as Holiday[], schoolZone);
  const breakToday = holidayOn(today, (holidayRows ?? []) as Holiday[], schoolZone);
  const cells = monthCells(month);
  const [year, monthNumber] = month.split("-").map(Number);
  const previous = new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
  const next = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 7);
  const monthHolidays = holidays.filter((holiday) => holiday.starts_on.slice(0, 7) <= month && holiday.ends_on.slice(0, 7) >= month);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">School dates, reminders, and the days a parent is flying.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <a className="underline" href={`/parent/calendar?month=${previous}`}>Previous</a>
          <a className="underline" href={`/parent/calendar?month=${next}`}>Next</a>
        </div>
      </div>
      {breakToday ? (
        <Card>
          <CardTitle>Break</CardTitle>
          <CardDescription>{breakToday.label}. Homework is not required on these days.</CardDescription>
          <form action={createBreakPlan} className="mt-3">
            <Button type="submit">Break plan</Button>
          </form>
        </Card>
      ) : null}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => <div key={label}>{label}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} />;
          const holiday = holidays.find((row) => row.kind === "holiday" && row.starts_on <= cell.day && cell.day <= row.ends_on);
          const flying = (roster ?? []).some((day) => String(day.date) === cell.day && (day.status === "flying" || day.status === "layover"));
          const titles = (events ?? []).filter((event) => dayKey(new Date(event.starts_at as string), timeZone) === cell.day).map((event) => event.title as string);
          return (
            <div key={cell.day} className={`min-h-16 rounded-md border border-border p-1 text-xs ${holiday ? "bg-sun/40" : "bg-card"} ${cell.day === today ? "ring-2 ring-primary" : ""}`}>
              <div className="font-medium">{Number(cell.day.slice(8))}</div>
              {flying ? <div>✈️</div> : null}
              {holiday ? <div className="truncate">{holiday.label}</div> : null}
              {titles.slice(0, 2).map((title) => <div key={title} className="truncate">{title}</div>)}
            </div>
          );
        })}
      </div>
      <Card>
        <CardTitle>Coming up</CardTitle>
        <ul className="mt-3 space-y-3 text-sm">
          {(reminders ?? []).length === 0 ? <li className="text-muted-foreground">No reminders yet.</li> : null}
          {(reminders ?? []).map((reminder) => (
            <li key={reminder.id} className="space-y-2">
              <p>
                {new Date(reminder.due_at as string).toLocaleString("en-GB", { timeZone, dateStyle: "medium", timeStyle: "short" })}
                {reminder.note ? ` · ${reminder.note}` : ""}
                {reminder.escalated ? " · Still waiting for the other parent." : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {["done", "30", "45", "60"].map((action) => (
                  <form key={action} action={snoozeReminder}>
                    <input type="hidden" name="reminderId" value={reminder.id} />
                    <input type="hidden" name="action" value={action} />
                    <Button type="submit" variant="outline">{action === "done" ? "Done" : `${action} min`}</Button>
                  </form>
                ))}
                <form action={snoozeReminder} className="flex gap-2">
                  <input type="hidden" name="reminderId" value={reminder.id} />
                  <input type="hidden" name="action" value="custom" />
                  <input name="minutes" type="number" aria-label="Snooze minutes" min={1} max={1440} placeholder="Custom" className="h-10 w-24 rounded-md border border-border bg-background px-2 text-sm" />
                  <Button type="submit" variant="ghost">Snooze</Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>School zone</CardTitle>
        <CardDescription>The winter break follows this zone. Your own dates replace the national ones.</CardDescription>
        <form action={saveZone} className="mt-3 flex gap-2">
          <select name="zone" aria-label="School zone" defaultValue={schoolZone} className="h-10 rounded-md border border-border bg-background px-2 text-sm">
            <option value="A">Zone A</option>
            <option value="B">Zone B</option>
            <option value="C">Zone C</option>
          </select>
          <Button type="submit" variant="outline">Save zone</Button>
        </form>
        <ul className="mt-4 space-y-3">
          {monthHolidays.map((holiday) => (
            <li key={`${holiday.label}-${holiday.starts_on}`}>
              <form action={saveHoliday} className="flex flex-wrap items-end gap-2 text-sm">
                <input type="hidden" name="label" value={holiday.label} />
                <input type="hidden" name="zone" value={holiday.zone ?? ""} />
                <span className="min-w-36">{holiday.label}</span>
                <input name="starts" type="date" aria-label={`Start of ${holiday.label}`} defaultValue={holiday.starts_on} className="h-10 rounded-md border border-border bg-background px-2" />
                <input name="ends" type="date" aria-label={`End of ${holiday.label}`} defaultValue={holiday.ends_on} className="h-10 rounded-md border border-border bg-background px-2" />
                <Button type="submit" variant="ghost">Save dates</Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
      {familyRow?.ics_token ? (
        <p className="text-sm text-muted-foreground">
          Private calendar link: <span className="break-all">/api/calendar/{familyRow.ics_token}</span>
        </p>
      ) : null}
    </div>
  );
}
