import { WhatsNew } from "@/components/kid/whats-new";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { promptForToday } from "@/lib/voice/packs";

export const dynamic = "force-dynamic";

export default async function WhatsNewPage() {
  const { supabase, family } = await getFamily();
  if (!family?.child_id) return null;
  const copy = t(family.child_language);
  const prompt = promptForToday();
  const { data: child } = await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle();
  const voiceOn = (child?.settings as { voice?: boolean } | null)?.voice !== false;
  return (
    <WhatsNew
      phraseId={prompt.id}
      question={prompt.fr}
      starter={prompt.starter}
      familyId={family.family_id}
      voiceOn={voiceOn}
      backHref="/kid/games/voice"
      copy={copy}
    />
  );
}
