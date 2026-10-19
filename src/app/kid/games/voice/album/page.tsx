import Link from "next/link";
import { AlbumCard } from "@/components/kid/album-card";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AlbumPage({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const copy = t(family.child_language);
  const { data } = await supabase
    .from("voice_recordings")
    .select("id, path, parent_reaction, created_at")
    .eq("child_id", family.child_id)
    .order("created_at", { ascending: false });
  const rows = data ?? [];
  if (rows.length === 0) {
    return (
      <div className="grid gap-4">
        <p className="text-center text-2xl">{family.child_language === "en" ? "Nothing recorded yet." : "Rien d'enregistré pour l'instant."}</p>
        <Link href="/kid/games/voice" className="flex h-14 items-center justify-center rounded-full bg-white/15 text-2xl">
          {copy.back}
        </Link>
      </div>
    );
  }
  const index = Math.max(0, Number((await searchParams).i) || 0) % rows.length;
  const row = rows[index];
  const next = (index + 1) % rows.length;
  const signed = await supabase.storage.from("voice").createSignedUrl(row.path, 60 * 10);
  return (
    <AlbumCard
      src={signed.data?.signedUrl ?? ""}
      reaction={row.parent_reaction}
      lang={family.child_language}
      nextHref={`/kid/games/voice/album?i=${next}`}
      backHref="/kid/games/voice"
      copy={copy}
    />
  );
}
