import { redirect } from "next/navigation";
import { TonightCard } from "@/components/parent/tonight-card";
import { ParentTabs } from "@/components/parent/parent-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getFamily } from "@/lib/family";
import { BUILD_PREVIEW } from "@/lib/preview";
import { lockAndGoToKid } from "@/app/parent/unlock/actions";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, family } = await getFamily();
  if (!BUILD_PREVIEW && !user) redirect("/login");
  if (!family) redirect("/join");

  return (
    <div className="min-h-dvh bg-[#f6f0ff] text-plum dark:bg-[#120818] dark:text-white">
      <header className="sticky top-0 z-20 bg-plum text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 pr-32">
          <div className="min-w-0">
            <p className="truncate font-fredoka text-2xl leading-none">{family.family_name}</p>
            <div className="mt-1 text-white/80">
              <TonightCard compact />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20" />
            <form action={lockAndGoToKid}>
              <Button type="submit" className="border-0 bg-hot text-white hover:opacity-90">
                Kid mode
              </Button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl">
          <ParentTabs />
        </div>
      </header>
      <div className="mx-auto max-w-6xl p-4 min-[820px]:p-6 [&_h1]:font-fredoka [&_h1]:text-3xl [&_h1]:text-plum dark:[&_h1]:text-white">{children}</div>
    </div>
  );
}
