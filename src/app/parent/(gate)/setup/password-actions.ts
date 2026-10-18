"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getFamily } from "@/lib/family";
import { nextPinGuard, pinLocked } from "@/lib/pin-guard";
import { readPinGuard, writePinGuard } from "@/lib/pin-guard-store";
import { createAdminClient } from "@/lib/supabase/admin";

const passwordSchema = z.string().min(8, "Use at least 8 characters").max(72);

function go(result: string): never {
  redirect(`/parent/setup?password=${result}`);
}

export async function changeOwnPassword(formData: FormData) {
  const current = passwordSchema.safeParse(formData.get("current"));
  const next = passwordSchema.safeParse(formData.get("next"));
  if (!current.success || !next.success) go("check");
  const { supabase, user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family || family.my_role !== "parent") redirect("/join");
  if (!user.email) go("failed");
  const { error } = await supabase.auth.signInWithPassword({ email: user.email, password: current.data });
  if (error) go("wrong");
  const { error: saved } = await supabase.auth.updateUser({ password: next.data });
  go(saved ? "failed" : "saved");
}

export async function setOtherPassword(formData: FormData) {
  const memberId = z.string().uuid().safeParse(formData.get("memberId"));
  const pin = z.string().regex(/^\d{4,6}$/).safeParse(formData.get("pin"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!memberId.success || !pin.success || !password.success) go("check");
  const { supabase, user, family } = await getFamily();
  if (!user) redirect("/login");
  if (!family || family.my_role !== "parent") redirect("/join");

  const now = Date.now() / 1000;
  const guard = await readPinGuard();
  if (pinLocked(guard, now)) go("locked");
  const { data: ok, error: pinError } = await supabase.rpc("verify_family_pin", { p_pin: pin.data });
  if (pinError || !ok) {
    await writePinGuard(nextPinGuard(guard, now, false));
    go("pin");
  }
  await writePinGuard(nextPinGuard(guard, now, true));

  const { data: member } = await supabase
    .from("members")
    .select("user_id, role")
    .eq("id", memberId.data)
    .eq("family_id", family.family_id)
    .maybeSingle();
  if (!member || member.role !== "parent" || member.user_id === user.id || !member.user_id) go("check");

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(member.user_id, { password: password.data });
    go(error ? "failed" : "other");
  } catch {
    go("failed");
  }
}
