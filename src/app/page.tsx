import { redirect } from "next/navigation";
import { getFamily } from "@/lib/family";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  redirect("/kid/home");
}
