import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { addReward, approveReward, denyReward, hideReward, raiseSkill, reactToVoice } from "@/app/parent/(gate)/progress/actions";
import { requireParent } from "@/lib/parent/guard";
import { skillStatus, weekCounts } from "@/lib/plan/outline";
import { ensureOutline } from "@/lib/plan/seed";
import { ensureStories } from "@/lib/stories/seed";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTable } from "@/lib/supabase/db-error";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const { supabase, user, family } = await requireParent();
  try {
    await ensureStories();
  } catch {
    // Stories stay empty until the stories table accepts the library.
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
  const [{ data: sessions }, { data: runs }, { data: reads }, { data: rewards }, { data: requests }, skillQuery, { data: progress }] = await Promise.all([
    supabase.from("game_sessions").select("game, created_at").eq("family_id", family.family_id).gte("created_at", week),
    supabase.from("homework_runs").select("id").eq("family_id", family.family_id).eq("status", "done").gte("updated_at", week),
    supabase.from("story_reads").select("story_id").eq("family_id", family.family_id).gte("completed_at", week),
    supabase.from("rewards").select("id, title, cost_stars, active").eq("family_id", family.family_id).order("cost_stars"),
    supabase.from("purchases").select("id, reward_id, status").eq("family_id", family.family_id).eq("status", "requested"),
    supabase.from("skills").select("skill_key, area, title_fr, explanation_en, ask_fr, sort").is("family_id", null).order("sort"),
    family.child_id ? supabase.from("skill_progress").select("skill, level").eq("child_id", family.child_id) : Promise.resolve({ data: [] }),
  ]);
  let skills = skillQuery.data ?? [];
  let skillsMissing = isMissingTable(skillQuery.error);
  if (skills.length === 0 && !skillsMissing) {
    try {
      const admin = createAdminClient();
      const shared = await admin.from("skills").select("skill_key, area, title_fr, explanation_en, ask_fr, sort").is("family_id", null).order("sort");
      if (isMissingTable(shared.error)) skillsMissing = true;
      else skills = shared.data ?? [];
    } catch {
      skills = [];
    }
  }
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
  const { data: log } = family.child_id
    ? await supabase.from("story_reads").select("story_id, completed_at").eq("child_id", family.child_id).order("completed_at", { ascending: false }).limit(12)
    : { data: [] as { story_id: string; completed_at: string }[] };
  const storyIds = (log ?? []).map((row) => row.story_id);
  const { data: titles } = storyIds.length > 0 ? await supabase.from("stories").select("id, title_fr, title_en").in("id", storyIds) : { data: [] };
  const titleOf = new Map((titles ?? []).map((story) => [story.id, family.child_language === "en" ? story.title_en : story.title_fr]));

  return (
    <div className="grid gap-4">
      <ParentNote
        title="This week"
        body={`${runs?.length ?? 0} homework, ${counts.games} games, ${counts.logic} logic, ${voiceThisWeek} voice, ${reads?.length ?? 0} stories. ${family.star_balance} stars. ${waiting} recording${waiting === 1 ? "" : "s"} waiting for a reaction.`}
      />
      <Card>
        <CardTitle>Reading log</CardTitle>
        <CardDescription>Stories Yana finished.</CardDescription>
        {(log ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {(log ?? []).map((row) => (
              <li key={`${row.story_id}-${row.completed_at}`}>
                {titleOf.get(row.story_id) || "Story"} · {String(row.completed_at).slice(0, 10)}
              </li>
            ))}
          </ul>
        )}
      </Card>
      {skills.length === 0 ? (
        <div className="space-y-2">
          <ParentNote
            title="Skills"
            body={outlineReady && !skillsMissing ? "No skills are listed yet." : "Skills could not be loaded."}
          />
          <a className="text-sm underline" href="/parent/setup/status">Setup checklist</a>
        </div>
      ) : (
        <Card>
          <CardTitle>General outline</CardTitle>
          <CardDescription>
            {user && family.child_id
              ? "Play can raise a skill. A higher status you set stays."
              : "This outline is on. A parent sets Practicing or Strong after sign-in."}
          </CardDescription>
          <ul className="mt-3 space-y-3">
            {skills.map((skill) => (
              <li key={skill.skill_key}>
                <p className="font-medium">{skill.title_fr}</p>
                <p className="text-sm text-muted-foreground">{skill.area} · {skillStatus(levels.get(skill.skill_key) ?? 0)} · {skill.explanation_en}</p>
                <p className="text-sm">Ask her: {skill.ask_fr}</p>
                {user && family.child_id ? (
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
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card>
        <CardTitle>Rewards</CardTitle>
        <CardDescription>Approving spends stars. Denying leaves them.</CardDescription>
        <form action={addReward} className="mt-3 flex flex-wrap gap-2">
          <input name="title" aria-label="Reward" placeholder="Reward" className="h-10 rounded-md border border-border bg-background px-2" />
          <input name="cost" type="number" aria-label="Star cost" min={1} max={100} defaultValue={5} className="h-10 w-20 rounded-md border border-border bg-background px-2" />
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
