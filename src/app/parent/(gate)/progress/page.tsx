import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { confirmStory, raiseSkill, reactToVoice, sendDigest } from "@/app/parent/(gate)/progress/actions";
import { requireParent } from "@/lib/parent/guard";
import { playDropped, scanUsage, suggestedNext, weekStartIso, weeklyDigest } from "@/lib/parent/progress";
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
  const lastWeek = new Date(week);
  lastWeek.setUTCDate(lastWeek.getUTCDate() - 7);
  const lastIso = lastWeek.toISOString();
  const [{ data: sessions }, { data: runs }, { data: reads }, { data: study }, { data: ledger }, { data: briefs }, skillQuery, { data: progress }] = await Promise.all([
    supabase.from("game_sessions").select("game, created_at").eq("family_id", family.family_id).gte("created_at", lastIso),
    supabase.from("homework_runs").select("id, hint_level, status, updated_at").eq("family_id", family.family_id).gte("updated_at", lastIso),
    supabase.from("story_reads").select("story_id, completed_at").eq("family_id", family.family_id).gte("completed_at", lastIso),
    supabase.from("sessions").select("duration_min, date").eq("family_id", family.family_id).gte("date", week.slice(0, 10)),
    family.child_id ? supabase.from("star_ledger").select("amount, reason, created_at").eq("child_id", family.child_id) : Promise.resolve({ data: [] as { amount: number; reason: string; created_at: string }[] }),
    supabase.from("tasks").select("coaching").eq("family_id", family.family_id),
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
  const thisSessions = (sessions ?? []).filter((session) => String(session.created_at) >= week);
  const lastSessions = (sessions ?? []).filter((session) => String(session.created_at) < week);
  const counts = weekCounts(thisSessions.map((session) => String(session.game)));
  const lastCounts = weekCounts(lastSessions.map((session) => String(session.game)));
  const doneRuns = (runs ?? []).filter((run) => run.status === "done" && String(run.updated_at) >= week);
  const lastDone = (runs ?? []).filter((run) => run.status === "done" && String(run.updated_at) < week);
  const hints = (runs ?? []).filter((run) => String(run.updated_at) >= week).reduce((sum, run) => sum + Math.max(0, Number(run.hint_level ?? 0)), 0);
  const storiesThisWeek = (reads ?? []).filter((row) => String(row.completed_at) >= week).length;
  const storiesLastWeek = (reads ?? []).length - storiesThisWeek;
  const waiting = (recordings ?? []).filter((row) => !row.parent_reaction).length;
  const levels = new Map((progress ?? []).map((row) => [row.skill, Number(row.level)]));
  const voiceThisWeek = (recordings ?? []).filter((row) => String(row.created_at) >= week).length;
  const voiceLastWeek = (recordings ?? []).filter((row) => String(row.created_at) >= lastIso && String(row.created_at) < week).length;
  const starsEarned = (ledger ?? []).filter((row) => String(row.created_at) >= week).reduce((sum, row) => sum + Math.max(0, Number(row.amount ?? 0)), 0);
  const studyMinutes = (study ?? []).reduce((sum, row) => sum + Math.max(0, Number(row.duration_min ?? 0)), 0);
  const usage = scanUsage((briefs ?? []).map((row) => Boolean((row.coaching as { from_cache?: boolean } | null)?.from_cache)));
  const paidStories = new Set((ledger ?? []).map((row) => String(row.reason)).filter((reason) => reason.startsWith("story:")).map((reason) => reason.slice(6)));
  const strong = [...levels.values()].filter((level) => skillStatus(level) === "strong").length;
  const practicing = [...levels.values()].filter((level) => skillStatus(level) === "practicing").length;
  const digest = weeklyDigest({
    childName: family.child_name || "Yana",
    homework: doneRuns.length,
    games: counts.games,
    logic: counts.logic,
    voice: voiceThisWeek,
    stories: storiesThisWeek,
    stars: starsEarned,
    hints,
    strong,
    practicing,
  });
  const quieter = playDropped(
    doneRuns.length + counts.games + counts.logic + voiceThisWeek + storiesThisWeek,
    lastDone.length + lastCounts.games + lastCounts.logic + voiceLastWeek + storiesLastWeek,
  );
  const nextSkills = suggestedNext(skills.map((skill) => ({ key: skill.skill_key, level: levels.get(skill.skill_key) ?? 0 })));
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
  const { data: titles } = storyIds.length > 0 ? await supabase.from("stories").select("id, slug, title_fr, title_en").in("id", storyIds) : { data: [] };
  const titleOf = new Map((titles ?? []).map((story) => [story.id, family.child_language === "en" ? story.title_en : story.title_fr]));
  const slugOf = new Map((titles ?? []).map((story) => [story.id, story.slug]));

  return (
    <div className="grid gap-4">
      <ParentNote
        title="This week"
        body={`${doneRuns.length} homework, ${counts.games} games, ${counts.logic} logic, ${voiceThisWeek} voice, ${storiesThisWeek} stories. ${studyMinutes} study minutes. ${starsEarned} stars earned. ${hints} hints. ${waiting} recording${waiting === 1 ? "" : "s"} waiting for a reaction.`}
      />
      {quieter ? <ParentNote title="This week was quieter" body="Yana played less this week. Try a family game or a new theme." /> : null}
      <Card>
        <CardTitle>AI usage</CardTitle>
        <CardDescription>{usage.ai} read by AI. {usage.cache} answered from a saved reading.</CardDescription>
      </Card>
      <Card>
        <CardTitle>Weekly note</CardTitle>
        <CardDescription>{digest}</CardDescription>
        <p className="mt-2 text-sm text-muted-foreground">Send posts this note to a linked Telegram chat. Sunday at 18:00 sends this same note with the school notes. Email is not connected.</p>
        <form action={sendDigest} className="mt-3">
          <input type="hidden" name="text" value={digest} />
          <Button type="submit" className="h-12">Send to Telegram</Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Reading log</CardTitle>
        <CardDescription>Stories Yana finished.</CardDescription>
        {(log ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">None yet.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {(log ?? []).map((row) => {
              const marked = paidStories.has(String(slugOf.get(row.story_id) ?? ""));
              return (
                <li key={`${row.story_id}-${row.completed_at}`} className="flex items-center justify-between gap-2">
                  <span>{titleOf.get(row.story_id) || "Story"} · {String(row.completed_at).slice(0, 10)}</span>
                  {marked ? <span>Marked</span> : (
                    <form action={confirmStory}>
                      <input type="hidden" name="id" value={row.story_id} />
                      <Button type="submit" variant="outline" className="h-12">She read it</Button>
                    </form>
                  )}
                </li>
              );
            })}
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
          {nextSkills.length > 0 ? (
            <p className="mt-3 text-sm">
              Suggested next: {nextSkills.map((key, index) => (
                <span key={key}>
                  {index > 0 ? ", " : ""}
                  <Link href={`/parent/curriculum#${key}`} className="underline">{skills.find((skill) => skill.skill_key === key)?.title_fr || key}</Link>
                </span>
              ))}
            </p>
          ) : null}
          <ul className="mt-3 space-y-3">
            {skills.map((skill) => (
              <li key={skill.skill_key}>
                <p className="font-medium">
                  <Link href={`/parent/curriculum#${skill.skill_key}`} className="underline">{skill.title_fr}</Link>
                </p>
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
      <p className="text-sm">
        <Link href="/parent/rewards" className="underline">Reward vault</Link>
      </p>
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
  return weekStartIso(new Date(), timeZone);
}
