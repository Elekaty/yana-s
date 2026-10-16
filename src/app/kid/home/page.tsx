import Link from "next/link";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function KidHomePage() {
  const { family } = await getFamily();
  const copy = t(family?.child_language);
  const name = family?.child_name ?? "";
  return (
    <div className="flex h-full flex-col justify-center gap-6">
      <h1 className="text-4xl">
        {copy.hello}
        {name ? `, ${name}` : ""}
      </h1>
      <p className="max-w-md text-xl text-white/85">{copy.homeBody}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/dev/mochi" className="flex h-14 items-center rounded-full bg-hot px-6 text-lg">
          {copy.seeMochi}
        </Link>
        <Link href="/parent/unlock" className="flex h-14 items-center rounded-full bg-white/15 px-6 text-lg">
          {copy.parents}
        </Link>
      </div>
    </div>
  );
}
