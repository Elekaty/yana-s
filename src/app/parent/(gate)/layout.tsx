import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getFamily } from "@/lib/family";
import { lockAndGoToKid } from "@/app/parent/unlock/actions";

export const dynamic = "force-dynamic";

const links = [
  ["Scan", "/parent"],
  ["Inbox", "/parent/inbox"],
  ["Calendar", "/parent/calendar"],
  ["To do", "/parent/todo"],
  ["Progress", "/parent/progress"],
  ["Setup", "/parent/setup"],
] as const;

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const { user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm text-muted-foreground">{family.family_name}</p>
          <p className="font-semibold">Parents</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={lockAndGoToKid}>
            <Button type="submit" variant="outline">
              Kid mode
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto grid max-w-5xl min-[820px]:grid-cols-[180px_1fr]">
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 min-[820px]:flex-col min-[820px]:border-b-0 min-[820px]:border-r">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 min-[820px]:p-6">{children}</div>
      </div>
    </div>
  );
}
