"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getFamily } from "@/lib/family";
import { clearUnlockCookie, writeUnlockCookie } from "@/lib/unlock-cookie";

export type PinState = { error: string };

const pinSchema = z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits");

export async function setPin(_prev: PinState, formData: FormData): Promise<PinState> {
  const parsed = pinSchema.safeParse(formData.get("pin"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the PIN" };
  const { supabase, user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  const { error } = await supabase.rpc("set_family_pin", { p_pin: parsed.data });
  if (error) return { error: error.message };
  await writeUnlockCookie(user.id, family.family_id);
  redirect("/parent");
}

export async function verifyPin(_prev: PinState, formData: FormData): Promise<PinState> {
  const parsed = pinSchema.safeParse(formData.get("pin"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the PIN" };
  const { supabase, user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family) redirect("/join");
  const { data: ok, error } = await supabase.rpc("verify_family_pin", { p_pin: parsed.data });
  if (error || !ok) return { error: "That PIN is not right." };
  await writeUnlockCookie(user.id, family.family_id);
  redirect("/parent");
}

export async function lockAndGoToKid() {
  await clearUnlockCookie();
  redirect("/kid/home");
}
