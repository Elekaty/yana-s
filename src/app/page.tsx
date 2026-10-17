import { redirect } from "next/navigation";
import { getFamily } from "@/lib/family";
import { demoMode } from "@/lib/preview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, family } = await getFamily();
  if (!demoMode() && !user) redirect("/login");
  if (!family) redirect("/join");
  redirect("/kid/home");
}
