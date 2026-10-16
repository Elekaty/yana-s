import { SongBoard } from "@/components/kid/song-board";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function MusicPage() {
  const { family } = await getFamily();
  return <SongBoard copy={t(family?.child_language)} lang={family?.child_language === "en" ? "en" : "fr"} />;
}
