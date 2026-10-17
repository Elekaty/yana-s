import Link from "next/link";
import { ParentNote } from "@/components/parent-note";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";
import { isMissingTable } from "@/lib/supabase/db-error";

export const dynamic = "force-dynamic";

const envNames = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ["SUPABASE", "SERVICE_ROLE_KEY"].join("_"),
  "GEMINI_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_WEBHOOK_SECRET",
  "USERBOT_WEBHOOK_SECRET",
  "INBOUND_EMAIL_SECRET",
  "INBOUND_EMAIL_DOMAIN",
  "CRON_SECRET",
  "APP_URL",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
] as const;

const tables = [
  ["messages", "id"],
  ["school_calendar", "id"],
  ["skills", "skill_key"],
  ["plan_items", "item_key"],
  ["rewards", "id"],
  ["roster_drafts", "id"],
] as const;

export default async function SetupStatusPage() {
  const { supabase, user, family } = await getFamily();
  if (!user || !family) return null;
  const [{ data: chats }, tableRows] = await Promise.all([
    supabase.from("telegram_chats").select("chat_id").eq("family_id", family.family_id),
    Promise.all(
      tables.map(async ([table, column]) => {
        const { error } = await supabase.from(table).select(column).limit(1);
        return { table, ok: !isMissingTable(error) };
      }),
    ),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Setup checklist</h1>
        <p className="text-sm text-muted-foreground">What is present. No secret values are shown.</p>
      </div>
      <Card>
        <CardTitle>Environment</CardTitle>
        <CardDescription>A missing name means that value is empty on this server.</CardDescription>
        <ul className="mt-3 space-y-1 text-sm">
          {envNames.map((name) => (
            <li key={name}>
              {process.env[name] ? "Ready" : "Missing"} · {name}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Tables</CardTitle>
        <ul className="mt-3 space-y-1 text-sm">
          {tableRows.map((row) => (
            <li key={row.table}>
              {row.ok ? "Present" : "Missing"} · {row.table}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Channels</CardTitle>
        <ul className="mt-3 space-y-1 text-sm">
          <li>{(chats ?? []).length > 0 ? "Linked" : "Not linked"} · Telegram chat</li>
          <li>{process.env.INBOUND_EMAIL_DOMAIN ? "Domain set" : "Domain missing"} · School email</li>
          <li>{process.env.CRON_SECRET ? "Secret set" : "Secret missing"} · Reminder job secret</li>
        </ul>
        <CardDescription>The minute job still has to be scheduled in Supabase. A set secret does not prove it is running.</CardDescription>
      </Card>
      {tableRows.some((row) => !row.ok) ? (
        <ParentNote title="Migrations" body="A missing table means that migration has not been applied in Supabase yet. Run supabase/migrations in order, from 0001 through 0010." />
      ) : (
        <ParentNote title="Migrations" body="The tables this screen checks are present." />
      )}
      <Link href="/parent/setup" className="text-sm underline">
        Back to setup
      </Link>
    </div>
  );
}
