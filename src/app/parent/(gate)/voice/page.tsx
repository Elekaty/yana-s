import { reactToVoice } from "@/app/parent/(gate)/progress/actions";
import { ParentNote } from "@/components/parent-note";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { requireParent } from "@/lib/parent/guard";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const { supabase, family } = await requireParent();
  const { data: recordings } = await supabase
    .from("voice_recordings")
    .select("id, path, parent_reaction, created_at")
    .eq("family_id", family.family_id)
    .order("created_at", { ascending: false });
  const clips = await Promise.all(
    (recordings ?? []).map(async (row) => {
      const signed = await supabase.storage.from("voice").createSignedUrl(row.path, 60 * 10);
      return { ...row, url: signed.data?.signedUrl ?? "" };
    }),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Voice</h1>
      {clips.length === 0 ? (
        <ParentNote title="No recordings yet" body="Yana records them in Say it. Nothing is graded, and a recording is never sent to an AI." />
      ) : null}
      {clips.map((clip) => (
        <Card key={clip.id}>
          <CardTitle>Recording</CardTitle>
          <CardDescription>{new Date(clip.created_at).toLocaleString("en-GB")}</CardDescription>
          {clip.url ? <audio className="mt-3 w-full" controls src={clip.url} /> : null}
          <p className="mt-3 text-2xl">{clip.parent_reaction ?? ""}</p>
          <div className="mt-3 flex gap-2">
            {["👍", "❤️", "🌟"].map((reaction) => (
              <form key={reaction} action={reactToVoice}>
                <input type="hidden" name="id" value={clip.id} />
                <input type="hidden" name="reaction" value={reaction} />
                <Button type="submit" size="lg" variant="outline" aria-label={reaction === "👍" ? "Thumbs up" : reaction === "❤️" ? "Heart" : "Star"}>
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
