import { addTask, addToCalendar, remindChild } from "@/app/parent/(gate)/calendar/actions";
import {
  archiveMessage,
  restoreMessage,
  retryReading,
  setSenderRule,
  setTier,
  tickMessage,
  untickMessage,
} from "@/app/parent/(gate)/inbox/actions";
import { remindSoon } from "@/app/parent/(gate)/today/actions";
import { ParentNote } from "@/components/parent-note";
import { SnoozeForms } from "@/components/parent/snooze-forms";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { matchesInboxFilter, parseInboxFilter } from "@/lib/inbox/filter";
import { canArchive, canUndo, type Tier } from "@/lib/inbox/sort";
import { requireParent } from "@/lib/parent/guard";
import { sourceLabel, tierLabel } from "@/lib/parent/today";
import { isMissingTable } from "@/lib/supabase/db-error";

export const dynamic = "force-dynamic";

const TIER_ORDER: Record<string, number> = { urgent: 0, important: 1, fyi: 2 };

const filters = [
  ["all", "All", "/parent/inbox"],
  ["urgent", "Urgent", "/parent/inbox?filter=urgent"],
  ["important", "Important", "/parent/inbox?filter=important"],
  ["fyi", "FYI", "/parent/inbox?filter=fyi"],
  ["mine", "Waiting for me", "/parent/inbox?filter=mine"],
  ["archive", "Archived", "/parent/inbox?folder=archive"],
] as const;

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ folder?: string; q?: string; filter?: string }> }) {
  const { supabase, user } = await requireParent();
  const query = await searchParams;
  const archive = query.folder === "archive";
  const filter = archive ? "all" : parseInboxFilter(query.filter);
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, source, sender, title, summary_en, original_text, read_status, tier, confidence, please_check, status, created_at")
    .eq("status", archive ? "archived" : "new")
    .order("created_at", { ascending: false })
    .limit(40);
  if (isMissingTable(error)) {
    return (
      <div className="space-y-3">
        <ParentNote title={archive ? "Archive" : "Inbox"} body="The inbox table is missing." />
        <a className="text-sm underline" href="/parent/setup/status">Setup checklist</a>
      </div>
    );
  }

  const rows = messages ?? [];
  const ids = rows.map((message) => message.id as string);
  const [{ data: parents }, { data: acks }, { data: alerts }, { data: files }] = await Promise.all([
    supabase.from("members").select("id, display_name, user_id, role").eq("role", "parent"),
    ids.length ? supabase.from("message_acks").select("message_id, member_id").in("message_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("message_alerts").select("message_id").in("message_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? supabase.from("attachments").select("message_id, path, mime").in("message_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const me = (parents ?? []).find((parent) => parent.user_id === user.id);
  const alerted = new Set((alerts ?? []).map((alert) => alert.message_id as string));
  const needle = (query.q ?? "").trim().toLowerCase();
  const visible = rows
    .filter((message) => {
      const seenByMe = Boolean(me && (acks ?? []).some((ack) => ack.message_id === message.id && ack.member_id === me.id));
      if (!matchesInboxFilter({ tier: (message.tier as string | null) ?? null }, filter, !seenByMe)) return false;
      if (!needle) return true;
      const haystack = `${message.title ?? ""} ${message.summary_en ?? ""} ${message.original_text ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    })
    .sort((a, b) => {
      const tier = (TIER_ORDER[a.tier as string] ?? 3) - (TIER_ORDER[b.tier as string] ?? 3);
      if (tier !== 0) return tier;
      return String(b.created_at).localeCompare(String(a.created_at));
    });
  const links = new Map<string, { href: string; mime: string }[]>();
  for (const file of files ?? []) {
    if (!visible.some((message) => message.id === file.message_id)) continue;
    const signed = await supabase.storage.from("attachments").createSignedUrl(file.path, 60 * 10);
    if (!signed.data?.signedUrl) continue;
    const list = links.get(file.message_id) ?? [];
    list.push({ href: signed.data.signedUrl, mime: String(file.mime ?? "file") });
    links.set(file.message_id, list);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{archive ? "Archive" : "Inbox"}</h1>
        <p className="text-sm text-muted-foreground">A message can be archived only after both parents have ticked it.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filters.map(([key, label, href]) => {
          const active = key === "archive" ? archive : !archive && filter === key;
          return (
            <a key={key} href={href} className={active ? chipOn : chipOff} aria-current={active ? "page" : undefined}>
              {label}
            </a>
          );
        })}
      </div>
      {archive ? (
        <form className="flex gap-2" action="/parent/inbox">
          <input type="hidden" name="folder" value="archive" />
          <input
            name="q"
            aria-label="Search the archive"
            defaultValue={query.q ?? ""}
            placeholder="Search the archive"
            className="h-12 flex-1 rounded-md border border-border bg-background px-3 text-sm"
          />
          <Button type="submit" size="lg" variant="outline">
            Search
          </Button>
        </form>
      ) : null}
      {rows.length === 0 ? (
        <ParentNote
          title="Nothing here"
          body={archive ? "Archived messages will show up in this folder." : "No messages yet. Forward a school email or post in the linked Telegram group."}
        />
      ) : visible.length === 0 ? (
        <ParentNote title="Nothing here" body="Nothing in this filter." />
      ) : null}
      {visible.map((message) => {
        const ticked = new Set((acks ?? []).filter((ack) => ack.message_id === message.id).map((ack) => ack.member_id as string));
        const parentRows = parents ?? [];
        const mine = Boolean(me && ticked.has(me.id));
        const other = parentRows.some((parent) => parent.id !== me?.id && ticked.has(parent.id));
        const ready = canArchive(parentRows.length, parentRows.filter((parent) => ticked.has(parent.id)).length);
        const undo = canUndo(mine, other);
        const failed = message.read_status === "failed";
        const photos = links.get(message.id) ?? [];
        const please = Boolean(message.please_check) || (typeof message.confidence === "number" && message.confidence < 0.6);
        return (
          <Card key={message.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <CardTitle>{failed ? "Could not read" : message.title || "Message"}</CardTitle>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{tierLabel(String(message.tier || "fyi"))}</span>
            </div>
            <CardDescription>
              {sourceLabel(String(message.source ?? ""))}
              {message.sender ? ` · ${senderLabel(String(message.sender))}` : ""}
            </CardDescription>
            {please ? <p className="mt-2 text-sm font-medium">Please check</p> : null}
            {alerted.has(message.id) ? <p className="mt-2 text-sm">Still waiting for a parent.</p> : null}
            {failed ? <p className="mt-3 text-sm">Could not read, open original.</p> : null}
            {!failed && message.summary_en ? <p className="mt-3 text-sm">{message.summary_en}</p> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{message.original_text}</p>
            <p className="mt-3 text-sm">
              {parentRows.map((parent) => `${parent.display_name} ${ticked.has(parent.id) ? "✓" : "○"}`).join("  ·  ")}
            </p>
            {photos.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm">
                {photos.map((photo) => (
                  <li key={photo.href}>
                    <a className="underline" href={photo.href} target="_blank" rel="noreferrer">
                      Open the saved {photo.mime.startsWith("image/") ? "photo" : "file"}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {archive ? (
              <form action={restoreMessage} className="mt-3">
                <input type="hidden" name="messageId" value={message.id} />
                <Button type="submit" size="lg" variant="outline">
                  Restore
                </Button>
              </form>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {mine ? (
                  undo ? (
                    <form action={untickMessage}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <Button type="submit" size="lg" variant="outline">
                        Undo my tick
                      </Button>
                    </form>
                  ) : null
                ) : (
                  <form action={tickMessage}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <Button type="submit" size="lg">I&apos;ve seen this</Button>
                  </form>
                )}
                <form action={archiveMessage}>
                  <input type="hidden" name="messageId" value={message.id} />
                  <Button type="submit" size="lg" variant="outline" disabled={!ready}>
                    {ready ? "Archive" : "Needs both parents"}
                  </Button>
                </form>
                {failed || (photos.length > 0 && !message.summary_en) ? (
                  <form action={retryReading}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <input type="hidden" name="includeImage" value={photos.some((photo) => photo.mime.startsWith("image/")) ? "yes" : "no"} />
                    <Button type="submit" size="lg" variant="outline">
                      {photos.length > 0 && !message.summary_en ? "Read this photo" : "Try again"}
                    </Button>
                  </form>
                ) : null}
              </div>
            )}
            {!archive && mine ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(["urgent", "important", "fyi"] as Tier[]).map((tier) => (
                  <form key={tier} action={setTier}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <input type="hidden" name="tier" value={tier} />
                    <Button type="submit" size="lg" variant={message.tier === tier ? "default" : "ghost"}>
                      {tierLabel(tier)}
                    </Button>
                  </form>
                ))}
                {message.sender ? (
                  <form action={setSenderRule}>
                    <input type="hidden" name="sender" value={message.sender} />
                    <input type="hidden" name="tier" value={message.tier || "important"} />
                    <Button type="submit" size="lg" variant="ghost">
                      Always treat this sender as {tierLabel(String(message.tier || "important"))}
                    </Button>
                  </form>
                ) : null}
                <form action={addTask}>
                  <input type="hidden" name="messageId" value={message.id} />
                  <Button type="submit" size="lg" variant="outline">+ To do</Button>
                </form>
                <form action={addToCalendar}>
                  <input type="hidden" name="messageId" value={message.id} />
                  <Button type="submit" size="lg" variant="outline">Add to calendar</Button>
                </form>
                <details className="rounded-md border border-border px-3">
                  <summary className="flex h-12 cursor-pointer items-center text-sm font-medium">Remind me</summary>
                  <SnoozeForms action={remindSoon} messageId={message.id} />
                </details>
                <form action={remindChild} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="messageId" value={message.id} />
                  <input name="when" type="datetime-local" aria-label="Remind Yana at" required className="h-12 rounded-md border border-border bg-background px-2 text-sm" />
                  <Button type="submit" size="lg" variant="ghost">Remind Yana</Button>
                </form>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

function senderLabel(sender: string) {
  return sender.startsWith("telegram:") ? "Telegram" : sender;
}

const chipOn = "inline-flex h-12 items-center rounded-full bg-grape px-4 text-sm font-semibold text-white";
const chipOff = "inline-flex h-12 items-center rounded-full border border-border px-4 text-sm font-medium";
