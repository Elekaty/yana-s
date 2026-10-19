import { CopyCode } from "@/app/parent/(gate)/setup/copy-code";
import { savePractice } from "@/app/parent/(gate)/setup/practice-actions";
import { addSender, registerWebhook, removeSender } from "@/app/parent/(gate)/setup/intake-actions";
import { confirmRoster, readRoster, saveAvailability, saveEvening, updateDraft, uploadRoster } from "@/app/parent/(gate)/setup/roster-actions";
import { sendTestMessage, trySchoolNote } from "@/app/parent/(gate)/setup/test-message";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { studySettings } from "@/lib/study/clock";
import { tablesFrom } from "@/lib/games/questions";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export const maxDuration = 60;

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ telegram?: string; roster?: string }> }) {
  const { supabase, family } = await requireParent();
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
  const settings = (familyRow?.settings as { mom_member_id?: string; dad_member_id?: string; daily_cap_minutes?: number; evening_from?: string; evening_to?: string; town_star_cap?: number; on_time_stars?: number; chest_minutes?: number; chest_daily_cap?: number; building_shop?: boolean } | null) ?? {};
  const { data: childRow } = family.child_id
    ? await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle()
    : { data: null };
  const practice = studySettings(familyRow?.settings);
  const tables = new Set(tablesFrom(childRow?.settings));
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
  const domain = process.env.INBOUND_EMAIL_DOMAIN ?? "";
  const inbound = domain ? `${family.invite_code}@${domain}` : "";
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
        <CardTitle>Checklist</CardTitle>
        <CardDescription>See which tables and keys are present, without showing secret values.</CardDescription>
        <a className="mt-3 inline-block text-sm underline" href="/parent/setup/status">Open the checklist</a>
        <form action={sendTestMessage} className="mt-3">
          <Button type="submit" size="lg" variant="outline">Send a test message</Button>
        </form>
        <form action={trySchoolNote} className="mt-3 space-y-2">
          <textarea
            name="text"
            required
            aria-label="French school note"
            placeholder="Paste a French school note"
            className="h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <Button type="submit" size="lg" variant="outline">Save this note to the inbox</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Invite the other parent</CardTitle>
        <CardDescription>On the other phone, open the app and choose Join with a code.</CardDescription>
        <CopyCode code={family.invite_code} />
      </Card>
      <Card>
        <CardTitle>Parents</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {parents.length === 0 ? <li>No parents are listed yet.</li> : null}
          {parents.map((member) => (
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
        <CardDescription>
          {inbound ? `Forward school mail to ${inbound}. Only the addresses below are saved.` : "School email is not set up yet. The forwarding address appears here once the inbound domain is set."}
        </CardDescription>
        <form action={addSender} className="mt-4 flex gap-2">
          <input
            name="email"
            type="email"
            required
            aria-label="School email"
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
        {drafts.error ? <p className="mt-3 text-sm">The roster table is missing. Open the setup checklist.</p> : null}
        {rosterNote ? <p className="mt-3 text-sm">{rosterNote}</p> : null}
        <form action={uploadRoster} className="mt-4 flex flex-wrap items-center gap-2">
          <select name="memberId" aria-label="Whose roster" className="h-10 rounded-md border border-border bg-background px-2 text-sm">
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.display_name}
              </option>
            ))}
          </select>
          <input name="file" type="file" aria-label="Roster file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="text-sm" />
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
                <select name="status" aria-label={`Status on ${draft.date}`} defaultValue={draft.status} className="h-10 rounded-md border border-border bg-background px-2">
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
          <select name="memberId" aria-label="Parent" className="h-10 rounded-md border border-border bg-background px-2">
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.display_name}
              </option>
            ))}
          </select>
          <select name="weekday" aria-label="Weekday" className="h-10 rounded-md border border-border bg-background px-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
          <input name="from" type="time" aria-label="Free from" required defaultValue="18:00" className="h-10 rounded-md border border-border bg-background px-2" />
          <input name="to" type="time" aria-label="Free until" required defaultValue="20:30" className="h-10 rounded-md border border-border bg-background px-2" />
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
        <CardTitle>Practice</CardTitle>
        <CardDescription>These times are the study block and the break. The town cap limits stars spent on buildings. Tables are the ones in Bulles and Fruits.</CardDescription>
        <form action={savePractice} className="mt-4 grid gap-3 text-sm">
          <label>
            Study minutes
            <input name="study" type="number" min={5} max={60} defaultValue={practice.studyMinutes} className="mt-1 block h-10 w-24 rounded-md border border-border bg-background px-2" />
          </label>
          <label>
            Break minutes
            <input name="break" type="number" min={5} max={40} defaultValue={practice.breakMinutes} className="mt-1 block h-10 w-24 rounded-md border border-border bg-background px-2" />
          </label>
          <label>
            Town star cap
            <input name="townCap" type="number" min={0} max={500} defaultValue={settings.town_star_cap ?? ""} placeholder="No cap" className="mt-1 block h-10 w-24 rounded-md border border-border bg-background px-2" />
          </label>
          <label className="flex h-12 items-center gap-2">
            <input type="checkbox" name="buildingShop" value="on" defaultChecked={settings.building_shop === true} />
            Enable the building shop
          </label>
          <label>
            On-time stars
            <input name="onTime" type="number" min={1} max={5} defaultValue={settings.on_time_stars ?? 2} className="mt-1 block h-10 w-24 rounded-md border border-border bg-background px-2" />
          </label>
          <label>
            Minutes per study chest
            <input name="chestMinutes" type="number" min={5} max={60} defaultValue={settings.chest_minutes ?? 10} className="mt-1 block h-10 w-24 rounded-md border border-border bg-background px-2" />
          </label>
          <label>
            Chests per day
            <input name="chestCap" type="number" min={0} max={5} defaultValue={settings.chest_daily_cap ?? 3} className="mt-1 block h-10 w-24 rounded-md border border-border bg-background px-2" />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="voice" value="on" defaultChecked={(childRow?.settings as { voice?: boolean } | null)?.voice !== false} />
            Mochi may speak
          </label>
          <fieldset className="flex flex-wrap gap-3">
            <legend>Tables</legend>
            {[2, 3, 4, 5, 10].map((table) => (
              <label key={table} className="flex items-center gap-1">
                <input type="checkbox" name="table" value={table} defaultChecked={tables.has(table)} />
                {table}
              </label>
            ))}
          </fieldset>
          <Button type="submit" className="w-fit">Save practice</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>{family.child_name ?? "Child"} sees</CardTitle>
        <CardDescription>French is the usual language. English or French stays at the top right of every page.</CardDescription>
      </Card>
    </div>
  );
}
