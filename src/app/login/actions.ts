"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parentLoginEmail } from "@/lib/auth-name";
import { resumeFromBreak } from "@/lib/study/resume";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REMEMBER_COOKIE, REMEMBER_SECONDS, authCookieOptions } from "@/lib/supabase/remember";

const accountSchema = z.object({
  name: z.string().trim().min(2, "Use a name with at least 2 letters").max(80),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export type LoginState = { error: string };

export async function submitLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  const email = parentLoginEmail(parsed.data.name);
  if (!email) return { error: "Use a name with at least 2 letters." };

  const remember = formData.get("remember") === "on";
  const jar = await cookies();
  jar.set(REMEMBER_COOKIE, remember ? "1" : "0", { ...authCookieOptions(true), maxAge: REMEMBER_SECONDS });

  if (formData.get("intent") === "create") {
    try {
      const admin = createAdminClient();
      const { error } = await admin.auth.admin.createUser({
        email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: { display_name: parsed.data.name.trim() },
      });
      if (error && !/already|registered|exists/i.test(error.message)) return { error: "Could not create the account." };
      if (error) return { error: "That name already has an account. Sign in." };
    } catch {
      return { error: "Sign-in is not set up yet." };
    }
  }

  const supabase = await createClient(remember);
  const { error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error) {
    return { error: /invalid|credentials/i.test(error.message) ? "That name or password is wrong." : "Could not sign in." };
  }
  const { data: family } = await supabase.rpc("my_family");
  const home = family as { family_id?: string; child_id?: string } | null;
  if (home?.family_id && home.child_id) await resumeFromBreak(supabase, home.family_id, home.child_id);
  redirect(home?.family_id ? "/kid/home" : "/join");
}
