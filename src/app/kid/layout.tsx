import Link from "next/link";
import { redirect } from "next/navigation";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function KidLayout({ children }: { children: React.ReactNode }) {
  const { user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  const copy = t(family.child_language);
  const links = [
    [copy.home, "/kid/home"],
    [copy.homework, "/kid/homework"],
    [copy.games, "/kid/games"],
    [copy.store, "/kid/store"],
  ] as const;

  return (
    <div className="min-h-dvh bg-plum text-white" style={{ fontFamily: "var(--font-fredoka), ui-rounded, system-ui, sans-serif" }}>
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col min-[820px]:flex-row">
        <main className="flex-1 p-6">{children}</main>
        <nav className="grid grid-cols-4 border-t border-white/15 min-[820px]:w-48 min-[820px]:grid-cols-1 min-[820px]:border-t-0 min-[820px]:border-l">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="flex h-14 items-center justify-center text-lg">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
