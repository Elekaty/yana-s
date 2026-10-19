import { Button } from "@/components/ui/button";

export function SnoozeForms({ action, messageId }: { action: (formData: FormData) => Promise<void>; messageId?: string }) {
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {[
        ["30", "30 min"],
        ["45", "45 min"],
        ["60", "1 hour"],
      ].map(([minutes, label]) => (
        <form key={minutes} action={action}>
          {messageId ? <input type="hidden" name="messageId" value={messageId} /> : null}
          <input type="hidden" name="minutes" value={minutes} />
          <Button type="submit" size="lg" variant="outline">{label}</Button>
        </form>
      ))}
      <form action={action} className="flex flex-wrap items-center gap-2">
        {messageId ? <input type="hidden" name="messageId" value={messageId} /> : null}
        <input name="minutes" type="number" min={1} max={1440} aria-label="Custom minutes" placeholder="Custom" className="h-12 w-24 rounded-md border border-border bg-background px-2 text-sm" />
        <Button type="submit" size="lg" variant="outline">Snooze</Button>
      </form>
    </div>
  );
}
