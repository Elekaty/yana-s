import { redirect } from "next/navigation";
import { getFamily } from "@/lib/family";
import { BUILD_PREVIEW } from "@/lib/preview";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, family } = await getFamily();
  if (!BUILD_PREVIEW && !user) redirect("/login");
  if (!family) redirect("/join");
  redirect("/kid/home");
}
