import { icsCalendar, visibleHolidays, type Holiday } from "@/lib/calendar/plan";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response("Not found", { status: 404 });
  const admin = createAdminClient();
  const { data: family } = await admin.from("families").select("id, timezone, settings").eq("ics_token", token).maybeSingle();
  if (!family) return new Response("Not found", { status: 404 });
  const zoneSetting = (family.settings as { school_zone?: string } | null)?.school_zone;
  const zone = zoneSetting === "B" || zoneSetting === "C" ? zoneSetting : "A";
  const [{ data: events }, { data: holidays }] = await Promise.all([
    admin.from("events").select("id, title, starts_at, ends_at").eq("family_id", family.id),
    admin.from("school_calendar").select("id, label, starts_on, ends_on, family_id, zone, kind").or(`family_id.is.null,family_id.eq.${family.id}`),
  ]);
  const shown = visibleHolidays((holidays ?? []) as Holiday[], zone);
  const body = icsCalendar([
    ...(events ?? []).map((event) => ({
      uid: `${event.id}@mochi`,
      title: String(event.title ?? "Event"),
      startsAt: String(event.starts_at),
      endsAt: event.ends_at ? String(event.ends_at) : null,
    })),
    ...shown.map((holiday) => ({
      uid: `${holiday.label}-${holiday.starts_on}@mochi`,
      title: holiday.label,
      startsAt: holiday.starts_on,
      endsAt: nextDate(holiday.ends_on),
      allDay: true,
    })),
  ]);
  return new Response(body, {
    headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": "inline; filename=mochi.ics" },
  });
}

function nextDate(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
