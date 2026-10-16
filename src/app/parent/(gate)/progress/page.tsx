import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { reactToVoice } from "@/app/parent/(gate)/progress/actions";
import { getFamily } from "@/lib/family";
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
  const { count } = await supabase.from("stories").select("id", { count: "exact", head: true }).is("family_id", null);
  const clips = await Promise.all(
    (recordings ?? []).map(async (row) => {
      const signed = await supabase.storage.from("voice").createSignedUrl(row.path, 60 * 10);
      return { ...row, url: signed.data?.signedUrl ?? "" };
    }),
  );

  return (
    <div className="grid gap-4">
      <ParentNote title="Progress" body="Stars, practice, and the weekly note will show here." />
      {(count ?? 0) === 0 ? (
        <ParentNote title="Stories" body="Paste supabase/migrations/0008_stories.sql in the Supabase SQL editor so Yana can open the stories." />
      ) : null}
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
