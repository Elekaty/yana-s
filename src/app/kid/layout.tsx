import Link from "next/link";
import { redirect } from "next/navigation";
import { BreakGate } from "@/components/kid/break-gate";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";
import { ensureStudyClock } from "@/lib/study/load";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  const copy = t(family.child_language);
  const links = [
    [copy.home, "/kid/home"],
    [copy.homework, "/kid/homework"],
    [copy.games, "/kid/games"],
  ] as const;
  const loaded = family.child_id ? await ensureStudyClock(supabase, family.family_id, family.child_id) : null;
  const { data: child } = family.child_id
    ? await supabase.from("children").select("settings").eq("id", family.child_id).maybeSingle()
    : { data: null };
  const voice = (child?.settings as { voice?: boolean } | null)?.voice !== false;

  return (
    <div className="kid min-h-dvh bg-plum text-white" style={{ fontFamily: "var(--font-fredoka), ui-rounded, system-ui, sans-serif" }}>
      <BreakGate
        settings={loaded?.settings ?? null}
        initial={loaded ? { ...loaded.clock, updatedAt: loaded.updatedAt } : null}
        hasPin={family.has_pin}
        lang={family.child_language}
        voice={voice}
        copy={copy}
      >
        <div className="mx-auto flex min-h-dvh max-w-5xl flex-col min-[820px]:flex-row">
          <main className="flex-1 p-4 pt-16 min-[820px]:p-6 min-[820px]:pt-16">{children}</main>
          <nav className="grid grid-cols-3 border-t border-white/15 min-[820px]:w-48 min-[820px]:grid-cols-1 min-[820px]:border-t-0 min-[820px]:border-l min-[820px]:pt-16">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="flex h-14 items-center justify-center text-lg">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </BreakGate>
    </div>
  );
}
