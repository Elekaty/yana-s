import { HomeScreen } from "@/components/kid/home-screen";
import { getFamily } from "@/lib/family";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function KidHomePage() {
  const { supabase, family } = await getFamily();
  const copy = t(family?.child_language);
  const today = family ? await todayTitle(supabase, family.family_id, family.child_language) : "";
  return (
    <HomeScreen
      childName={family?.child_name ?? ""}
      lang={family?.child_language === "en" ? "en" : "fr"}
      stars={family?.star_balance ?? 0}
      today={today}
      copy={copy}
    />
  );
}

async function todayTitle(
  supabase: Awaited<ReturnType<typeof getFamily>>["supabase"],
  familyId: string,
  lang: "fr" | "en",
) {
  const { data: scans } = await supabase
    .from("homework_scans")
    .select("id, status")
    .eq("family_id", familyId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(5);
  const scanIds = (scans ?? []).map((scan) => scan.id);
  if (scanIds.length === 0) return "";
  const { data: tasks } = await supabase
    .from("tasks")
    .select("title, subject, status, scan_id")
    .in("scan_id", scanIds);
  const open = (tasks ?? []).find((task) => task.status !== "completed") ?? tasks?.[0];
  if (!open) return "";
  return (lang === "en" ? open.subject : open.title) || open.subject || open.title || "";
}
