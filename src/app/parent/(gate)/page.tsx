import Link from "next/link";
import { getFamily } from "@/lib/family";
import { loadToday } from "@/lib/parent/queries";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const { supabase, user, family } = await getFamily();
  if (!family || !user) return null;
  const today = await loadToday(supabase, family, user.id);
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-grape/15 bg-card p-4">
        <h1>Today</h1>
        <p className="mt-2 text-sm">{today.unseenCount === 0 ? "All caught up. Nothing is waiting for you." : `${today.unseenCount} messages need you.`}</p>
        {today.unseenCount > 0 ? (
          <Link href="/parent/inbox" className="mt-3 inline-flex h-12 items-center text-sm font-semibold underline">
            Open inbox ({today.unseenCount})
          </Link>
        ) : null}
      </section>
      <section className="rounded-2xl border border-grape/15 bg-card p-4">
        <h2 className="font-fredoka text-2xl">Tonight</h2>
        <p className="mt-1 text-sm">{today.tonightLine}</p>
      </section>
      <section className="rounded-2xl border border-grape/15 bg-card p-4">
        <h2 className="font-fredoka text-2xl">Homework today</h2>
        <p className="mt-1 text-sm">{today.homework}</p>
        <Link href="/parent/scan" className="mt-3 inline-flex h-12 items-center rounded-full bg-grape px-4 text-sm font-semibold text-white">
          Scan homework
        </Link>
      </section>
    </div>
  );
}
