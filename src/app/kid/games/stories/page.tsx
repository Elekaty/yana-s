import Link from "next/link";
import { KidBack } from "@/components/kid/kid-back";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";
import { ensureStories } from "@/lib/stories/seed";

export const dynamic = "force-dynamic";

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const lang = family?.child_language === "en" ? "en" : "fr";
  try {
    await ensureStories();
  } catch {
    // The stories still show after 0008 is pasted.
  }
  const { data } = await supabase.from("stories").select("slug, title_fr, title_en").order("slug");
  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <div className="grid gap-4">
        <KidBack href={kidPlaces.words} label={copy.back} />
        <p className="text-center text-2xl">{lang === "en" ? "No stories yet." : "Pas encore d'histoire."}</p>
      </div>
    );
  }
  const index = Math.max(0, Number((await searchParams).i) || 0) % rows.length;
  const row = rows[index];
  const next = (index + 1) % rows.length;
  const title = family?.child_language === "en" ? row.title_en : row.title_fr;
  return (
    <div className="grid gap-4">
      <KidBack href={kidPlaces.words} label={copy.back} />
      <p className="text-center text-3xl">{title}</p>
      <Link href={`/kid/games/stories/${row.slug}`} className="flex h-14 items-center justify-center rounded-full bg-sun text-2xl text-plum">
        {copy.listen}
      </Link>
      <Link href={`/kid/games/stories?i=${next}`} className="flex h-14 items-center justify-center rounded-full bg-grape text-2xl">
        {copy.next}
      </Link>
    </div>
  );
}
