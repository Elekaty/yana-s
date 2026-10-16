import { CopyCode } from "@/app/parent/(gate)/setup/copy-code";
import { setChildLanguage } from "@/app/parent/(gate)/setup/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getFamily } from "@/lib/family";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const { supabase, family } = await getFamily();
  if (!family) return null;
  const { data: members } = await supabase.from("members").select("id, display_name, role").order("display_name");

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Invite the other parent</CardTitle>
        <CardDescription>They sign in, choose Join with a code, and type this.</CardDescription>
        <CopyCode code={family.invite_code} />
      </Card>
      <Card>
        <CardTitle>Parents</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {(members ?? []).map((member) => (
            <li key={member.id}>
              {member.display_name} · {member.role}
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle>{family.child_name ?? "Child"} sees</CardTitle>
        <CardDescription>French is the usual language. You can switch it to English.</CardDescription>
        <form action={setChildLanguage} className="mt-4 flex gap-2">
          <Button type="submit" name="language" value="fr" variant={family.child_language === "fr" ? "default" : "outline"}>
            French
          </Button>
          <Button type="submit" name="language" value="en" variant={family.child_language === "en" ? "default" : "outline"}>
            English
          </Button>
        </form>
      </Card>
    </div>
  );
}
