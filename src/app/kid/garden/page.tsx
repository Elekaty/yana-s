import { KidBack } from "@/components/kid/kid-back";
import { KidMochi } from "@/components/kid/kid-mochi";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { kidPlaces } from "@/lib/kid/places";

export const dynamic = "force-dynamic";

export default async function GardenPage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  return (
    <div className="grid gap-3">
      <KidBack href={kidPlaces.corner} label={copy.back} />
      <KidMochi />
      <p className="text-center text-6xl" aria-hidden>🌱</p>
      <p className="text-center text-3xl">{copy.garden}</p>
    </div>
  );
}
