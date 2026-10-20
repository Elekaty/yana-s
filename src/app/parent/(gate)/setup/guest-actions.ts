"use server";

import { revalidatePath } from "next/cache";
import { getFamily } from "@/lib/family";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function createGuestLink() {
  const ctx = await parentSettings();
  if (!ctx) return;
  ctx.settings.guest_token = crypto.randomUUID();
  ctx.settings.guest_expires_at = new Date(Date.now() + WEEK_MS).toISOString();
  await ctx.supabase.from("families").update({ settings: ctx.settings }).eq("id", ctx.familyId);
  revalidatePath("/parent/setup");
}

export async function revokeGuestLink() {
  const ctx = await parentSettings();
  if (!ctx) return;
  delete ctx.settings.guest_token;
  delete ctx.settings.guest_expires_at;
  await ctx.supabase.from("families").update({ settings: ctx.settings }).eq("id", ctx.familyId);
  revalidatePath("/parent/setup");
}

async function parentSettings() {
  const { supabase, family } = await getFamily();
  if (!family || family.my_role !== "parent") return null;
  const { data } = await supabase.from("families").select("settings").eq("id", family.family_id).single();
  const settings = { ...((data?.settings as Record<string, unknown> | null) ?? {}) };
  return { supabase, familyId: family.family_id, settings };
}
