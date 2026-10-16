import { CopyCode } from "@/app/parent/(gate)/setup/copy-code";
import { setChildLanguage } from "@/app/parent/(gate)/setup/actions";
import { addSender, registerWebhook, removeSender } from "@/app/parent/(gate)/setup/intake-actions";
import { confirmRoster, readRoster, saveAvailability, saveEvening, updateDraft, uploadRoster } from "@/app/parent/(gate)/setup/roster-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ telegram?: string; roster?: string }> }) {
  const { supabase, family } = await getFamily();
  if (!family) return null;
  const query = await searchParams;
  const [{ data: members }, { data: senders }, { data: chats }, drafts, { data: hours }, { data: familyRow }] = await Promise.all([
    supabase.from("members").select("id, display_name, role").order("display_name"),
    supabase.from("allowed_senders").select("id, email").order("email"),
    supabase.from("telegram_chats").select("chat_id, title").eq("family_id", family.family_id),
    supabase.from("roster_drafts").select("id, member_id, date, status").order("date"),
    supabase.from("availability").select("member_id, weekday, from_time, to_time"),
    supabase.from("families").select("settings").eq("id", family.family_id).maybeSingle(),
  ]);
  const parents = (members ?? []).filter((member) => member.role === "parent");
  const settings = (familyRow?.settings as { mom_member_id?: string; dad_member_id?: string; daily_cap_minutes?: number; evening_from?: string; evening_to?: string } | null) ?? {};
  const rosterNote =
    query.roster === "saved"
      ? "The photo is saved. Press Read the roster. Nothing is confirmed until you press Confirm."
      : query.roster === "read"
        ? "Check each day, then press Confirm."
        : query.roster === "failed"
          ? "Could not read the roster. Try another photo."
          : query.roster === "large"
            ? "Use a photo or PDF under 4 MB."
            : query.roster === "type"
              ? "Use a JPEG, PNG, WebP, or PDF."
              : "";
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
        <CardTitle>Roster</CardTitle>
        <CardDescription>Upload Mom&apos;s roster. Edit the days, then press Confirm. Flying and layover days are added to the calendar only after that.</CardDescription>
        {drafts.error ? <p className="mt-3 text-sm">Apply supabase/migrations/0007_roster.sql in the Supabase SQL editor, then reload this page.</p> : null}
        {rosterNote ? <p className="mt-3 text-sm">{rosterNote}</p> : null}
        <form action={uploadRoster} className="mt-4 flex flex-wrap items-center gap-2">
          <select name="memberId" className="h-10 rounded-md border border-border bg-background px-2 text-sm">
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.display_name}
              </option>
            ))}
          </select>
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="text-sm" />
          <Button type="submit" variant="outline">
            Upload
          </Button>
        </form>
        <form action={readRoster} className="mt-3">
          <Button type="submit" variant="outline">
            Read the roster
          </Button>
        </form>
        <ul className="mt-4 space-y-2">
          {(drafts.data ?? []).map((draft) => (
            <li key={draft.id}>
              <form action={updateDraft} className="flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="id" value={draft.id} />
                <span className="w-28">{draft.date}</span>
                <select name="status" defaultValue={draft.status} className="h-10 rounded-md border border-border bg-background px-2">
                  {["off", "flying", "standby", "layover"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Button type="submit" variant="ghost">
                  Update
                </Button>
              </form>
            </li>
          ))}
        </ul>
        {parents.map((parent) => (
          <form key={parent.id} action={confirmRoster} className="mt-3">
            <input type="hidden" name="memberId" value={parent.id} />
            <Button type="submit">Confirm {parent.display_name}</Button>
          </form>
        ))}
      </Card>
      <Card>
        <CardTitle>Evening</CardTitle>
        <CardDescription>Dad&apos;s free hours, who is Mom and Dad, and the daily cap. A session never runs longer than the cap.</CardDescription>
        <form action={saveEvening} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
          <label>
            Mom
            <select name="mom" defaultValue={settings.mom_member_id || parents[0]?.id} className="mt-1 block h-10 rounded-md border border-border bg-background px-2">
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.display_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dad
            <select name="dad" defaultValue={settings.dad_member_id || parents[1]?.id || parents[0]?.id} className="mt-1 block h-10 rounded-md border border-border bg-background px-2">
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.display_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input name="from" type="time" defaultValue={settings.evening_from || "18:00"} required className="mt-1 block h-10 rounded-md border border-border bg-background px-2" />
          </label>
          <label>
            To
            <input name="to" type="time" defaultValue={settings.evening_to || "20:00"} required className="mt-1 block h-10 rounded-md border border-border bg-background px-2" />
          </label>
          <label>
            Cap
            <input name="cap" type="number" min={5} max={60} defaultValue={settings.daily_cap_minutes || 15} className="mt-1 block h-10 w-20 rounded-md border border-border bg-background px-2" />
          </label>
          <Button type="submit" variant="outline">
            Save evening
          </Button>
        </form>
        <form action={saveAvailability} className="mt-4 flex flex-wrap items-end gap-2 text-sm">
          <select name="memberId" className="h-10 rounded-md border border-border bg-background px-2">
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.display_name}
              </option>
            ))}
          </select>
          <select name="weekday" className="h-10 rounded-md border border-border bg-background px-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
          <input name="from" type="time" required defaultValue="18:00" className="h-10 rounded-md border border-border bg-background px-2" />
          <input name="to" type="time" required defaultValue="20:30" className="h-10 rounded-md border border-border bg-background px-2" />
          <Button type="submit" variant="outline">
            Save free hours
          </Button>
        </form>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {(hours ?? []).map((hour) => (
            <li key={`${hour.member_id}-${hour.weekday}`}>
              {parents.find((parent) => parent.id === hour.member_id)?.display_name ?? "Parent"} · {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][Number(hour.weekday)]} · {String(hour.from_time).slice(0, 5)}–{String(hour.to_time).slice(0, 5)}
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
