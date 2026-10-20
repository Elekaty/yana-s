import { createBreakPlan, removeEvent, saveEvent, saveHoliday, saveZone, snoozeReminder } from "@/app/parent/(gate)/calendar/actions";
import { ParentNote } from "@/components/parent-note";
import { PhoneReminders } from "@/components/parent/phone-reminders";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ensureHolidays } from "@/lib/calendar/seed";
import { dayKey, displayTitle, eventMark, holidayOn, monthCells, visibleHolidays, type Holiday } from "@/lib/calendar/plan";
import { requireParent } from "@/lib/parent/guard";
import { isMissingTable } from "@/lib/supabase/db-error";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; day?: string }> }) {
  const { supabase, family } = await requireParent();
  try {
    await ensureHolidays();
  } catch {
    // A missing school_calendar table is reported below.
  }
  const timeZone = family.timezone || "Europe/Paris";
  const today = dayKey(new Date(), timeZone);
  const query = await searchParams;
  const requested = query.month ?? today.slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(requested) ? requested : today.slice(0, 7);
  const own = await supabase.from("events").select("id, title, starts_at, source_message_id").eq("family_id", family.family_id).order("starts_at");
  const reminderQuery = await supabase.from("reminders").select("id, due_at, status, note, escalated, target, ref_type, ref_id").neq("status", "done").order("due_at").limit(12);
  const rosterQuery = await supabase.from("roster_days").select("date, status").eq("family_id", family.family_id);
  const holidayQuery = await supabase.from("school_calendar").select("family_id, label, starts_on, ends_on, zone, kind");
  const familyQuery = await supabase.from("families").select("ics_token, settings").eq("id", family.family_id).maybeSingle();
  const events = own.data;
  const reminders = reminderQuery.data;
  const roster = rosterQuery.data;
  const holidayRows = holidayQuery.data;
  const holidayError = holidayQuery.error;
  const familyRow = familyQuery.data;
  const familyError = familyQuery.error;
  if (isMissingTable(holidayError) || isMissingTable(familyError)) {
    return (
      <div className="space-y-3">
        <ParentNote title="Calendar" body="School dates could not be loaded." />
        <a className="text-sm underline" href="/parent/setup/status">Setup checklist</a>
      </div>
    );
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
  const selectedDay = query.day && /^\d{4}-\d{2}-\d{2}$/.test(query.day) ? query.day : today;
  const dayEvents = (events ?? []).filter((event) => dayKey(new Date(event.starts_at as string), timeZone) === selectedDay);
  const coming = (events ?? []).filter((event) => dayKey(new Date(event.starts_at as string), timeZone) >= today).slice(0, 5);
  const eventNames = new Map((events ?? []).map((event) => [String(event.id), displayTitle(String(event.title))]));
  const vapid = process.env.VAPID_PUBLIC_KEY ?? "";

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
          const marks = [
            flying ? "✈️" : "",
            holiday ? "🏖️" : "",
            ...titles.map((title) => {
              const event = (events ?? []).find((item) => item.title === title && dayKey(new Date(item.starts_at as string), timeZone) === cell.day);
              const kind = eventMark(title, Boolean(event?.source_message_id));
              return kind === "homework" ? "📝" : kind === "school" ? "🏫" : "🏠";
            }),
          ].filter(Boolean);
          return (
            <a key={cell.day} href={`/parent/calendar?month=${month}&day=${cell.day}`} className={`block min-h-16 rounded-md border border-border p-1 text-xs ${holiday ? "bg-sun/40" : "bg-card"} ${cell.day === today ? "ring-2 ring-primary" : ""} ${cell.day === selectedDay ? "ring-2 ring-grape" : ""}`}>
              <div className="font-medium">{Number(cell.day.slice(8))}</div>
              <div aria-hidden="true">{marks.join(" ")}</div>
              {holiday ? <div className="truncate">{holiday.label}</div> : null}
            </a>
          );
        })}
      </div>
      <Card>
        <CardTitle>{selectedDay}</CardTitle>
        <CardDescription>Tap a day to see it. A holiday band runs across its days.</CardDescription>
        {dayEvents.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nothing on this day.</p> : null}
        <ul className="mt-3 space-y-2">
          {dayEvents.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {eventMark(String(event.title), Boolean(event.source_message_id)) === "homework" ? "📝 " : eventMark(String(event.title), Boolean(event.source_message_id)) === "school" ? "🏫 " : "🏠 "}
                {displayTitle(String(event.title))}
              </span>
              <form action={removeEvent}>
                <input type="hidden" name="eventId" value={event.id} />
                <Button type="submit" size="lg" variant="outline">Remove</Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Add event</CardTitle>
        <form action={saveEvent} className="mt-3 grid gap-2">
          <input name="title" aria-label="Event title" required placeholder="Title" className="h-12 rounded-md border border-border bg-background px-3" />
          <input name="when" type="datetime-local" aria-label="Date and time" required defaultValue={`${selectedDay}T10:00`} className="h-12 rounded-md border border-border bg-background px-3" />
          <select name="type" aria-label="Event type" defaultValue="family" className="h-12 rounded-md border border-border bg-background px-2">
            <option value="school">School</option>
            <option value="family">Family</option>
            <option value="homework">Homework</option>
          </select>
          <select name="reminder" aria-label="Reminder" defaultValue="morning" className="h-12 rounded-md border border-border bg-background px-2">
            <option value="morning">Morning of</option>
            <option value="day">1 day before</option>
            <option value="week">1 week and 1 day before</option>
          </select>
          <Button type="submit" size="lg">Add event</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Coming up</CardTitle>
        {coming.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No events yet.</p> : null}
        <ul className="mt-3 space-y-1 text-sm">
          {coming.map((event) => (
            <li key={event.id}>
              <a className="underline" href={`/parent/calendar?month=${String(event.starts_at).slice(0, 7)}&day=${dayKey(new Date(event.starts_at as string), timeZone)}`}>
                {displayTitle(String(event.title))} · {dayKey(new Date(event.starts_at as string), timeZone)}
              </a>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Reminders</CardTitle>
        <ul className="mt-3 space-y-3 text-sm">
          {(reminders ?? []).length === 0 ? <li className="text-muted-foreground">No reminders yet.</li> : null}
          {(reminders ?? []).map((reminder) => {
            const name = reminder.ref_type === "event" ? eventNames.get(String(reminder.ref_id)) : null;
            return (
            <li key={reminder.id} className="space-y-2">
              <p>
                {name ? `${name} · ` : ""}
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
            );
          })}
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
      <Card>
        <CardTitle>This phone</CardTitle>
        <CardDescription>
          {vapid ? "Allow reminders on this phone. They also go to the linked Telegram chat, with Done, 30, 45, and 60." : "Phone reminders need the push keys. Telegram still sends them when the bot is linked."}
        </CardDescription>
        {vapid ? <div className="mt-3"><PhoneReminders publicKey={vapid} /></div> : null}
      </Card>
      {familyRow?.ics_token ? (
        <p className="text-sm">
          <a className="underline" href={`/api/calendar/${familyRow.ics_token}`}>Download the calendar</a>
        </p>
      ) : null}
    </div>
  );
}
