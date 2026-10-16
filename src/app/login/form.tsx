"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { REMEMBER_COOKIE, REMEMBER_SECONDS, authCookieOptions } from "@/lib/supabase/remember";

export function LoginForm({ linkError }: { linkError: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(linkError);
  const [pending, setPending] = useState(false);
  const [remember, setRemember] = useState(true);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    const secure = authCookieOptions(true).secure ? "; Secure" : "";
    document.cookie = remember
      ? `${REMEMBER_COOKIE}=1; Path=/; Max-Age=${REMEMBER_SECONDS}; SameSite=Lax${secure}`
      : `${REMEMBER_COOKIE}=0; Path=/; Max-Age=${REMEMBER_SECONDS}; SameSite=Lax${secure}`;
    const supabase = createClient(remember);
    const { error: signError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setPending(false);
    if (signError) setError(signError.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Card className="w-full">
        <CardTitle>Mochi & Friends</CardTitle>
        <CardDescription>Parents sign in with an email link. No password.</CardDescription>
        {sent ? (
          <p className="mt-6 text-sm">Check your email and open the link in this browser.</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember this device
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Email me a link"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
