import { VoiceLadder } from "@/components/kid/voice-ladder";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { allPhrases } from "@/lib/voice/packs";

export const dynamic = "force-dynamic";

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const copy = t(family.child_language);
  const phrases = allPhrases();
  const index = Math.max(0, Number((await searchParams).i) || 0) % phrases.length;
  const phrase = phrases[index];
  const next = (index + 1) % phrases.length;
  const { data: child } = await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle();
  const voiceOn = (child?.settings as { voice?: boolean } | null)?.voice !== false;
  return (
    <VoiceLadder
      phraseId={phrase.id}
      text={phrase[family.child_language]}
      lang={family.child_language}
      familyId={family.family_id}
      voiceOn={voiceOn}
      nextHref={`/kid/games/voice/practice?i=${next}`}
      backHref="/kid/games/voice"
      copy={copy}
    />
  );
}
