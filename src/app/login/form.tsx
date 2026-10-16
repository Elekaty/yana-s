"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createParentAccount } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { REMEMBER_COOKIE, REMEMBER_SECONDS, authCookieOptions } from "@/lib/supabase/remember";

function rememberThisDevice(remember: boolean) {
  const secure = authCookieOptions(true).secure ? "; Secure" : "";
  const value = remember ? "1" : "0";
  document.cookie = `${REMEMBER_COOKIE}=${value}; Path=/; Max-Age=${REMEMBER_SECONDS}; SameSite=Lax${secure}`;
}

export function LoginForm() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [remember, setRemember] = useState(true);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    rememberThisDevice(remember);
    const supabase = createClient(remember);

    if (creating) {
      const created = await createParentAccount(email, password);
      if (created.error) {
        setPending(false);
        setError(created.error);
        return;
      }
    }

    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (signError) {
      setError(signError.message.toLowerCase().includes("invalid") ? "That email or password is wrong." : "Could not sign in.");
      return;
    }
    router.refresh();
    router.push("/");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Card className="w-full">
        <CardTitle>Mochi & Friends</CardTitle>
        <CardDescription>
          {creating
            ? "Create a parent account with an email and a password."
            : "Parents sign in with an email and a password."}
        </CardDescription>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={creating ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            Remember this device
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Please wait…" : creating ? "Create account" : "Sign in"}
          </Button>
          <button
            type="button"
            className="block text-sm underline"
            onClick={() => {
              setCreating((value) => !value);
              setError("");
            }}
          >
            {creating ? "Already have an account? Sign in" : "New parent? Create an account"}
          </button>
        </form>
      </Card>
    </main>
  );
}
