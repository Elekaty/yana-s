import { redirect } from "next/navigation";
import { BreakGate } from "@/components/kid/break-gate";
import { KidNav } from "@/components/kid/kid-nav";
import { ScreenVoice } from "@/components/kid/screen-voice";
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
    <div className="kid min-h-dvh bg-[radial-gradient(circle_at_top,_#6d3aa8_0%,_#2A0B4A_46%,_#1a062c_100%)] text-white" style={{ fontFamily: "var(--font-fredoka), ui-rounded, system-ui, sans-serif" }}>
      <BreakGate
        settings={loaded?.settings ?? null}
        initial={loaded ? { ...loaded.clock, updatedAt: loaded.updatedAt } : null}
        hasPin={family.has_pin}
        lang={family.child_language}
        voice={voice}
        copy={copy}
      >
        <div className="mx-auto flex min-h-dvh max-w-5xl flex-col min-[820px]:flex-row">
          <ScreenVoice lang={family.child_language === "en" ? "en" : "fr"} name={family.child_name ?? ""} voice={voice} />
          <main className="flex-1 p-4 pt-16 min-[820px]:p-6 min-[820px]:pt-16">{children}</main>
          <KidNav links={links} />
        </div>
      </BreakGate>
    </div>
  );
}
