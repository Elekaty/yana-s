"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const accountSchema = z.object({
  email: z.string().trim().email("Enter a real email").max(200),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export async function createParentAccount(email: string, password: string): Promise<{ error: string }> {
  const parsed = accountSchema.safeParse({ email, password });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    });
    if (!error) return { error: "" };
    if (/already|registered|exists/i.test(error.message)) {
      return { error: "That email already has an account. Sign in." };
    }
    return { error: "Could not create the account." };
  } catch {
    return { error: "Sign-in is not set up yet." };
  }
}
