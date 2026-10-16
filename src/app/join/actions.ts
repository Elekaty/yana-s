"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/family";
import { writeUnlockCookie } from "@/lib/unlock-cookie";

export type FormState = { error: string };

const createSchema = z.object({
  familyName: z.string().trim().min(1).max(80),
  displayName: z.string().trim().min(1).max(80),
  childName: z.string().trim().min(1).max(80),
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits"),
  timezone: z.string().trim().min(1).max(80),
});

const joinSchema = z.object({
  code: z.string().trim().min(4).max(20),
  displayName: z.string().trim().min(1).max(80),
});

export async function createFamily(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = createSchema.safeParse({
    familyName: formData.get("familyName"),
    displayName: formData.get("displayName"),
    childName: formData.get("childName"),
    pin: formData.get("pin"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };

  const { supabase, user } = await getSession();
  if (!user) redirect("/login");
  const { data: familyId, error } = await supabase.rpc("create_family", {
    p_name: parsed.data.familyName,
    p_timezone: parsed.data.timezone,
    p_display_name: parsed.data.displayName,
    p_child_name: parsed.data.childName,
  });
  if (error || !familyId) return { error: error?.message ?? "Could not create the family" };

  const { error: pinError } = await supabase.rpc("set_family_pin", { p_pin: parsed.data.pin });
  if (pinError) return { error: pinError.message };

  await writeUnlockCookie(user.id, familyId);
  redirect("/parent/inbox");
}

export async function joinFamily(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = joinSchema.safeParse({
    code: formData.get("code"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const { supabase, user } = await getSession();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("join_family", {
    p_code: parsed.data.code,
    p_display_name: parsed.data.displayName,
  });
  if (error) return { error: error.message };
  redirect("/parent/unlock");
}
