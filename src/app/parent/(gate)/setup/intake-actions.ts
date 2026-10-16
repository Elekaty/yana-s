"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getFamily } from "@/lib/family";
import { extractEmail } from "@/lib/intake/mail";

const emailSchema = z.string().email();

export async function addSender(formData: FormData) {
  const { supabase, family } = await getFamily();
  if (!family || family.my_role !== "parent") return;
  const parsed = emailSchema.safeParse(extractEmail(String(formData.get("email") ?? "")));
  if (!parsed.success) return;
  await supabase.from("allowed_senders").insert({ family_id: family.family_id, email: parsed.data });
  revalidatePath("/parent/setup");
}

export async function removeSender(formData: FormData) {
  const { supabase, family } = await getFamily();
  if (!family || family.my_role !== "parent") return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("allowed_senders").delete().eq("id", id).eq("family_id", family.family_id);
  revalidatePath("/parent/setup");
}

export async function registerWebhook() {
  const { family } = await getFamily();
  if (!family || family.my_role !== "parent") return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const app = appUrl();
  if (!token || !secret || !app) redirect("/parent/setup?telegram=missing");
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: `${app}/api/intake/telegram`,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  });
  redirect(`/parent/setup?telegram=${response.ok ? "connected" : "failed"}`);
}

function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}
