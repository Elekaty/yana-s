"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getFamily } from "@/lib/family";
import { extractEmail } from "@/lib/intake/mail";
import { publicAppUrl } from "@/lib/intake/public-url";

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
  const app = publicAppUrl({
    APP_URL: process.env.APP_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  });
  if (!token || !secret || !app) redirect("/parent/setup?telegram=missing");
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: `${app}/api/intake/telegram`,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  redirect(`/parent/setup?telegram=${response.ok ? "connected" : "failed"}`);
}
