import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { addReward, approveReward, denyReward, hideReward, raiseSkill, reactToVoice } from "@/app/parent/(gate)/progress/actions";
import { getFamily } from "@/lib/family";
import { skillStatus, weekCounts } from "@/lib/plan/outline";
import { ensureOutline } from "@/lib/plan/seed";
import { ensureStories } from "@/lib/stories/seed";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const { supabase, family } = await getFamily();
  if (!family) return null;
  try {
    await ensureStories();
  } catch {
    // Pasting 0008_stories.sql still fills the stories.
  }
  const { data: recordings } = await supabase
    .from("voice_recordings")
    .select("id, path, parent_reaction, created_at")
    .eq("family_id", family.family_id)
    .order("created_at", { ascending: false });
  let outlineReady = true;
  try {
    await ensureOutline();
  } catch {
    outlineReady = false;
  }
  const week = weekStart(family.timezone || "Europe/Paris");
  const [{ data: sessions }, { data: runs }, { data: reads }, { data: rewards }, { data: requests }, { data: skills }, { data: progress }] = await Promise.all([
    supabase.from("game_sessions").select("game, created_at").eq("family_id", family.family_id).gte("created_at", week),
    supabase.from("homework_runs").select("id").eq("family_id", family.family_id).eq("status", "done").gte("updated_at", week),
    supabase.from("story_reads").select("story_id").eq("family_id", family.family_id).gte("completed_at", week),
    supabase.from("rewards").select("id, title, cost_stars, active").eq("family_id", family.family_id).order("cost_stars"),
    supabase.from("purchases").select("id, reward_id, status").eq("family_id", family.family_id).eq("status", "requested"),
    supabase.from("skills").select("skill_key, area, title_fr, explanation_en, ask_fr, sort").is("family_id", null).order("sort"),
    family.child_id ? supabase.from("skill_progress").select("skill, level").eq("child_id", family.child_id) : Promise.resolve({ data: [] }),
  ]);
  const counts = weekCounts((sessions ?? []).map((session) => String(session.game)));
  const waiting = (recordings ?? []).filter((row) => !row.parent_reaction).length;
  const levels = new Map((progress ?? []).map((row) => [row.skill, Number(row.level)]));
  const voiceThisWeek = (recordings ?? []).filter((row) => String(row.created_at) >= week).length;
  const clips = await Promise.all(
    (recordings ?? []).map(async (row) => {
      const signed = await supabase.storage.from("voice").createSignedUrl(row.path, 60 * 10);
      return { ...row, url: signed.data?.signedUrl ?? "" };
    }),
  );

  return (
    <div className="grid gap-4">
      <ParentNote
        title="This week"
        body={`${runs?.length ?? 0} homework, ${counts.games} games, ${counts.logic} logic, ${voiceThisWeek} voice, ${reads?.length ?? 0} stories. ${family.star_balance} stars. ${waiting} recording${waiting === 1 ? "" : "s"} waiting for a reaction.`}
      />
      {!outlineReady || (skills ?? []).length === 0 ? (
        <ParentNote title="Skills" body="Paste supabase/migrations/0010_plan.sql in the Supabase SQL editor. This is a general outline." />
      ) : (
        <Card>
          <CardTitle>General outline</CardTitle>
          <CardDescription>Play can raise a skill. A higher status you set stays.</CardDescription>
          <ul className="mt-3 space-y-3">
            {(skills ?? []).map((skill) => (
              <li key={skill.skill_key}>
                <p className="font-medium">{skill.title_fr}</p>
                <p className="text-sm text-muted-foreground">{skill.area} · {skillStatus(levels.get(skill.skill_key) ?? 0)} · {skill.explanation_en}</p>
                <p className="text-sm">Ask her: {skill.ask_fr}</p>
                <div className="mt-1 flex gap-2">
                  <form action={raiseSkill}>
                    <input type="hidden" name="key" value={skill.skill_key} />
                    <input type="hidden" name="level" value="1" />
                    <Button type="submit" variant="outline">Practicing</Button>
                  </form>
                  <form action={raiseSkill}>
                    <input type="hidden" name="key" value={skill.skill_key} />
                    <input type="hidden" name="level" value="3" />
                    <Button type="submit" variant="outline">Strong</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <CardTitle>Rewards</CardTitle>
        <CardDescription>Approving spends stars. Denying leaves them.</CardDescription>
        <form action={addReward} className="mt-3 flex flex-wrap gap-2">
          <input name="title" placeholder="Reward" className="h-10 rounded-md border border-border bg-background px-2" />
          <input name="cost" type="number" min={1} max={100} defaultValue={5} className="h-10 w-20 rounded-md border border-border bg-background px-2" />
          <Button type="submit">Add</Button>
        </form>
        <ul className="mt-3 space-y-2">
          {(rewards ?? []).filter((reward) => reward.active).map((reward) => (
            <li key={reward.id} className="flex items-center justify-between gap-2">
              <span>{reward.title} · {reward.cost_stars} stars</span>
              <form action={hideReward}>
                <input type="hidden" name="id" value={reward.id} />
                <Button type="submit" variant="ghost">Hide</Button>
              </form>
            </li>
          ))}
        </ul>
        <ul className="mt-3 space-y-2">
          {(requests ?? []).map((request) => {
            const reward = (rewards ?? []).find((item) => item.id === request.reward_id);
            return (
              <li key={request.id} className="flex flex-wrap items-center gap-2">
                <span>{reward?.title ?? "Reward"}</span>
                <form action={approveReward}>
                  <input type="hidden" name="id" value={request.id} />
                  <Button type="submit">Approve</Button>
                </form>
                <form action={denyReward}>
                  <input type="hidden" name="id" value={request.id} />
                  <Button type="submit" variant="outline">Deny</Button>
                </form>
              </li>
            );
          })}
        </ul>
      </Card>
      {clips.length === 0 ? <ParentNote title="Voice" body="Recordings Yana makes will show here. Nothing is graded, and a recording is never sent to an AI." /> : null}
      {clips.map((clip) => (
        <Card key={clip.id}>
          <CardTitle>Voice</CardTitle>
          <CardDescription>{new Date(clip.created_at).toLocaleString("en-GB")}</CardDescription>
          {clip.url ? <audio className="mt-3 w-full" controls src={clip.url} /> : null}
          <p className="mt-3 text-2xl">{clip.parent_reaction ?? ""}</p>
          <div className="mt-3 flex gap-2">
            {["👍", "❤️", "🌟"].map((reaction) => (
              <form key={reaction} action={reactToVoice}>
                <input type="hidden" name="id" value={clip.id} />
                <input type="hidden" name="reaction" value={reaction} />
                <Button type="submit" variant="outline">
                  {reaction}
                </Button>
              </form>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function weekStart(timeZone: string) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const date = new Date(`${today}T12:00:00Z`);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString();
}
