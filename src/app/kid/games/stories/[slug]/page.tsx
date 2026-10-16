import Link from "next/link";
import { StoryReader } from "@/components/kid/story-reader";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const copy = t(family.child_language);
  const { slug } = await params;
  const { data } = await supabase.from("stories").select("slug, pages").eq("slug", slug).maybeSingle();
  const pages = Array.isArray(data?.pages)
    ? data.pages.filter(
        (page): page is { fr: string; en: string } =>
          Boolean(page) && typeof page === "object" && "fr" in page && "en" in page && typeof page.fr === "string" && typeof page.en === "string",
      )
    : [];
  if (!data || pages.length === 0) {
    return (
      <Link href="/kid/games/stories" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
        {copy.back}
      </Link>
    );
  }
  const { data: child } = await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle();
  const voiceOn = (child?.settings as { voice?: boolean } | null)?.voice !== false;
  return <StoryReader slug={data.slug} pages={pages} lang={family.child_language} voiceOn={voiceOn} backHref="/kid/games/stories" copy={copy} />;
}
