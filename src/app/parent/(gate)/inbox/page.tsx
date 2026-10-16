import { retryReading } from "@/app/parent/(gate)/inbox/actions";
import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { supabase, family } = await getFamily();
  if (!family) return null;
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, source, title, summary_en, original_text, read_status, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    return <ParentNote title="Inbox" body="Apply supabase/migrations/0004_intake.sql in the Supabase SQL editor, then reload this page." />;
  }
  const ids = (messages ?? []).map((message) => message.id as string);
  const { data: files } = ids.length
    ? await supabase.from("attachments").select("message_id, path, mime").in("message_id", ids)
    : { data: [] };
  const links = new Map<string, { href: string; mime: string }[]>();
  for (const file of files ?? []) {
    const signed = await supabase.storage.from("attachments").createSignedUrl(file.path, 60 * 10);
    if (!signed.data?.signedUrl) continue;
    const list = links.get(file.message_id) ?? [];
    list.push({ href: signed.data.signedUrl, mime: file.mime ?? "file" });
    links.set(file.message_id, list);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-sm text-muted-foreground">School messages from Telegram and email. Archive arrives in the next step.</p>
      </div>
      {(messages ?? []).length === 0 ? <ParentNote title="Nothing saved yet" body="Link the class chat from Setup, or forward a school email to the family address." /> : null}
      {(messages ?? []).map((message) => {
        const failed = message.read_status === "failed";
        const waiting = message.read_status === "saved" || message.read_status === "reading";
        const photos = links.get(message.id) ?? [];
        return (
          <Card key={message.id}>
            <CardTitle>{failed ? "Could not read" : message.title || (waiting ? "Waiting to read" : "Message")}</CardTitle>
            <CardDescription>
              {message.source} · {new Date(message.created_at).toLocaleString()}
            </CardDescription>
            {failed ? <p className="mt-3 text-sm">Could not read, open original.</p> : null}
            {!failed && message.summary_en ? <p className="mt-3 text-sm">{message.summary_en}</p> : null}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer">Open original</summary>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{message.original_text || "No text was saved."}</p>
              <ul className="mt-2 space-y-1">
                {photos.map((photo) => (
                  <li key={photo.href}>
                    <a className="underline" href={photo.href} target="_blank" rel="noreferrer">
                      Open the saved {photo.mime.startsWith("image/") ? "photo" : "file"}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
            {failed || (photos.length > 0 && !message.summary_en) ? (
              <form action={retryReading} className="mt-3">
                <input type="hidden" name="messageId" value={message.id} />
                <input type="hidden" name="includeImage" value={photos.some((photo) => photo.mime.startsWith("image/")) ? "yes" : "no"} />
                <Button type="submit" variant="outline">
                  {photos.length > 0 && !message.summary_en ? "Read this photo" : "Try again"}
                </Button>
              </form>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
