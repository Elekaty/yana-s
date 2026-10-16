import { CopyCode } from "@/app/parent/(gate)/setup/copy-code";
import { setChildLanguage } from "@/app/parent/(gate)/setup/actions";
import { addSender, registerWebhook, removeSender } from "@/app/parent/(gate)/setup/intake-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";

export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ telegram?: string }> }) {
  const { supabase, family } = await getFamily();
  if (!family) return null;
  const query = await searchParams;
  const [{ data: members }, { data: senders }, { data: chats }] = await Promise.all([
    supabase.from("members").select("id, display_name, role").order("display_name"),
    supabase.from("allowed_senders").select("id, email").order("email"),
    supabase.from("telegram_chats").select("chat_id, title").eq("family_id", family.family_id),
  ]);
  const domain = process.env.INBOUND_EMAIL_DOMAIN || "your-domain";
  const inbound = `${family.invite_code}@${domain}`;
  const telegramNote =
    query.telegram === "connected"
      ? "The webhook is registered."
      : query.telegram === "missing"
        ? "Add the bot token, the webhook secret, and APP_URL, then try again."
        : query.telegram === "failed"
          ? "Telegram did not accept the webhook."
          : "";

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Invite the other parent</CardTitle>
        <CardDescription>They sign in, choose Join with a code, and type this.</CardDescription>
        <CopyCode code={family.invite_code} />
      </Card>
      <Card>
        <CardTitle>Parents</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {(members ?? []).map((member) => (
            <li key={member.id}>
              {member.display_name} · {member.role}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>Telegram</CardTitle>
        <CardDescription>
          Add the bot to the class group. In BotFather, send /setprivacy and choose Disable. Then send /link {family.invite_code} in the group.
          {(chats ?? []).length > 0 ? ` Linked chats: ${(chats ?? []).map((chat) => chat.title || chat.chat_id).join(", ")}.` : " No chat is linked yet."}
        </CardDescription>
        <form action={registerWebhook} className="mt-4">
          <Button type="submit" variant="outline">
            Register the webhook
          </Button>
        </form>
        {telegramNote ? <p className="mt-2 text-sm">{telegramNote}</p> : null}
      </Card>
      <Card>
        <CardTitle>School email</CardTitle>
        <CardDescription>Forward school mail to {inbound}. Only the addresses below are saved.</CardDescription>
        <form action={addSender} className="mt-4 flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="teacher@school.fr"
            className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm"
          />
          <Button type="submit" variant="outline">
            Add
          </Button>
        </form>
        <ul className="mt-3 space-y-2 text-sm">
          {(senders ?? []).map((sender) => (
            <li key={sender.id} className="flex items-center justify-between gap-2">
              <span>{sender.email}</span>
              <form action={removeSender}>
                <input type="hidden" name="id" value={sender.id} />
                <Button type="submit" variant="ghost">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>{family.child_name ?? "Child"} sees</CardTitle>
        <CardDescription>French is the usual language. You can switch it to English.</CardDescription>
        <form action={setChildLanguage} className="mt-4 flex gap-2">
          <Button type="submit" name="language" value="fr" variant={family.child_language === "fr" ? "default" : "outline"}>
            French
          </Button>
          <Button type="submit" name="language" value="en" variant={family.child_language === "en" ? "default" : "outline"}>
            English
          </Button>
        </form>
      </Card>
    </div>
  );
}
