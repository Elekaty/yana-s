"use client";

import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions } from "@/lib/supabase/remember";

export function createClient(remember = true) {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: authCookieOptions(remember),
  });
}
