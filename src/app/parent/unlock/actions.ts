"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getFamily } from "@/lib/family";
import { resumeFromBreak } from "@/lib/study/resume";
import { nextPinGuard, pinLocked } from "@/lib/pin-guard";
import { readPinGuard, writePinGuard } from "@/lib/pin-guard-store";
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
  const now = Date.now() / 1000;
  const guard = await readPinGuard();
  if (pinLocked(guard, now)) return { error: "Too many tries. Wait 5 minutes, then try the PIN again." };
  const { data: ok, error } = await supabase.rpc("verify_family_pin", { p_pin: parsed.data });
  if (error || !ok) {
    await writePinGuard(nextPinGuard(guard, now, false));
    return { error: "That PIN is not right." };
  }
  await writePinGuard(nextPinGuard(guard, now, true));
  await writeUnlockCookie(user.id, family.family_id);
  redirect("/parent");
}

export async function lockAndGoToKid() {
  const { supabase, family } = await getFamily();
  if (family?.child_id) await resumeFromBreak(supabase, family.family_id, family.child_id);
  await clearUnlockCookie();
  redirect("/kid/home");
}
