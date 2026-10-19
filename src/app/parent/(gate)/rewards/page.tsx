import { addReward, approveReward, denyReward, hideReward } from "@/app/parent/(gate)/progress/actions";
import { Button } from "@/components/ui/button";
import { requireParent } from "@/lib/parent/guard";
import { isMissingTable } from "@/lib/supabase/db-error";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const { supabase, family } = await requireParent();
  const [{ data: rewards, error: rewardError }, { data: requests, error: requestError }] = await Promise.all([
    supabase.from("rewards").select("id, title, cost_stars, active").eq("family_id", family.family_id).order("cost_stars"),
    supabase.from("purchases").select("id, reward_id").eq("family_id", family.family_id).eq("status", "requested"),
  ]);
  const rewardsMissing = isMissingTable(rewardError) || isMissingTable(requestError);
  const vault = (rewards ?? []).filter((reward) => reward.active);
  const waiting = requests ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Rewards</h1>
      <p className="rounded-2xl border border-grape/15 bg-card px-4 py-3 text-sm">
        Balance <span className="font-semibold">{family.star_balance}</span> stars
      </p>
      <form action={addReward} className="space-y-3 rounded-2xl border border-grape/15 bg-card p-4">
        <h2 className="font-fredoka text-lg text-plum dark:text-white">New reward</h2>
        <label className="block text-sm">
          Prize
          <input name="title" required maxLength={80} className="mt-1 block h-12 w-full rounded-md border border-border bg-background px-3" />
        </label>
        <label className="block text-sm">
          Star cost
          <input name="cost" type="number" required min={1} max={100} defaultValue={5} className="mt-1 block h-12 w-28 rounded-md border border-border bg-background px-3" />
        </label>
        <Button type="submit" size="lg">Add reward</Button>
      </form>
      <section className="rounded-2xl border border-grape/15 bg-card p-4">
        <h2 className="font-fredoka text-lg text-plum dark:text-white">Requests</h2>
        {rewardsMissing ? <p className="mt-2 text-sm">The rewards table is missing. <a className="underline" href="/parent/setup/status">Setup checklist</a></p> : null}
        {!rewardsMissing && waiting.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No requests yet.</p> : null}
        <ul className="mt-3 space-y-3">
          {waiting.map((request) => {
            const reward = (rewards ?? []).find((item) => item.id === request.reward_id);
            return (
              <li key={request.id}>
                <p className="text-sm">{reward?.title ?? "Prize"} · {reward?.cost_stars ?? "?"} stars</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={approveReward}>
                    <input type="hidden" name="id" value={request.id} />
                    <Button type="submit" size="lg">Approve</Button>
                  </form>
                  <form action={denyReward}>
                    <input type="hidden" name="id" value={request.id} />
                    <Button type="submit" size="lg" variant="outline">Not now</Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="rounded-2xl border border-grape/15 bg-card p-4">
        <h2 className="font-fredoka text-lg text-plum dark:text-white">Reward vault</h2>
        {!rewardsMissing && vault.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No prizes yet. Add one and Yana can ask for it.</p> : null}
        <ul className="mt-3 space-y-2">
          {vault.map((reward) => (
            <li key={reward.id} className="flex items-center justify-between gap-2">
              <span className="text-sm">{reward.title} · {reward.cost_stars} stars</span>
              <form action={hideReward}>
                <input type="hidden" name="id" value={reward.id} />
                <Button type="submit" size="lg" variant="ghost">Remove</Button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
