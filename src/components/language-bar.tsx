import { cookies } from "next/headers";
import { LanguageSwitch } from "@/components/language-switch";
import { getFamily } from "@/lib/family";

export async function LanguageBar() {
  const { family } = await getFamily();
  const jar = await cookies();
  const saved = jar.get("mf_lang")?.value === "fr" ? "fr" : jar.get("mf_lang")?.value === "en" ? "en" : null;
  const language = family?.child_language ?? saved ?? "fr";
  return <LanguageSwitch language={language} />;
}
