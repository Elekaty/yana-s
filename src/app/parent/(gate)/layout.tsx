import { redirect } from "next/navigation";
import { ParentNav } from "@/components/parent/parent-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getFamily } from "@/lib/family";
import { loadToday } from "@/lib/parent/queries";
import { lockAndGoToKid } from "@/app/parent/unlock/actions";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  const today = await loadToday(supabase, family, user.id).catch(() => null);

  return (
    <div className="min-h-dvh bg-[#f6f0ff] text-plum dark:bg-[#120818] dark:text-white min-[1024px]:grid min-[1024px]:grid-cols-[15rem_1fr]">
      <ParentNav unseen={today?.unseenCount ?? 0} />
      <div className="min-w-0">
        <header className="sticky top-0 z-20 bg-plum text-white shadow-lg">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 pr-28">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-fredoka text-2xl leading-none">{today?.childName ?? family.child_name ?? "Yana"}</p>
                <p className="mt-1 truncate text-sm text-white/80">{today?.tonightLine ?? "Tonight"}</p>
              </div>
              <p className="shrink-0 rounded-full bg-sun px-3 py-2 text-sm font-semibold text-plum">{today?.stars ?? family.star_balance} stars</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle className="h-12 border-white/25 bg-white/10 text-white hover:bg-white/20" />
              <form action={lockAndGoToKid}>
                <Button type="submit" className="h-12 border-0 bg-hot text-white hover:opacity-90">
                  Kid mode
                </Button>
              </form>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl p-4 pb-24 min-[1024px]:p-6 [&_h1]:font-fredoka [&_h1]:text-3xl [&_h1]:text-plum dark:[&_h1]:text-white">{children}</div>
      </div>
    </div>
  );
}
