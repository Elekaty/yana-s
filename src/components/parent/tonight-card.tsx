import { swapTonight } from "@/app/parent/(gate)/setup/roster-actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";
import { loadTonight } from "@/lib/plan/load";

export async function TonightCard({ compact = false }: { compact?: boolean }) {
  const { supabase, family } = await getFamily();
  if (!family || family.my_role !== "parent") return null;
  const plan = await loadTonight(supabase, family);
  const { data: parents } = await supabase.from("members").select("id").eq("role", "parent");
  const other = (parents ?? []).map((parent) => parent.id as string).find((id) => id !== plan.leaderId);
  const line = plan.voiceNote
    ? `Tonight: ${plan.leaderName}, ${plan.duration} min, plus a voice note`
    : `Tonight: ${plan.leaderName}, ${plan.start}, ${plan.duration} min`;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>{line}</span>
        {other ? (
          <form action={swapTonight}>
            <input type="hidden" name="leaderId" value={other} />
            <Button type="submit" variant="ghost">
              Swap
            </Button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <Card>
      <CardTitle>{line}</CardTitle>
      <CardDescription>{plan.voiceNote ? "Neither parent is home and free." : "The parent who is home and free leads."}</CardDescription>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
        {plan.questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>
      {other ? (
        <form action={swapTonight} className="mt-3">
          <input type="hidden" name="leaderId" value={other} />
          <Button type="submit" variant="outline">
            Swap
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
