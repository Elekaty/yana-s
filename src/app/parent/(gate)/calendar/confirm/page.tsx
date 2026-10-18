import { saveEvent } from "@/app/parent/(gate)/calendar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export default async function ConfirmEventPage({ searchParams }: { searchParams: Promise<{ message?: string; title?: string; starts?: string }> }) {
  const { family } = await requireParent();
  const query = await searchParams;
  const timeZone = family.timezone || "Europe/Paris";
  return (
    <Card>
      <CardTitle>Add to calendar</CardTitle>
      <CardDescription>Check the date, then save it. A reminder is set for the morning of, or the day before when it is more than a week away.</CardDescription>
      <form action={saveEvent} className="mt-4 space-y-3">
        <input type="hidden" name="messageId" value={query.message ?? ""} />
        <label className="block text-sm">
          Title
          <input name="title" defaultValue={query.title ?? ""} required className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" />
        </label>
        <label className="block text-sm">
          Date and time ({timeZone})
          <input name="when" type="datetime-local" required defaultValue={localInput(query.starts ?? "", timeZone)} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" />
        </label>
        <Button type="submit">Save on the calendar</Button>
      </form>
    </Card>
  );
}

function localInput(iso: string, timeZone: string) {
  if (!iso || Number.isNaN(Date.parse(iso))) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
}
