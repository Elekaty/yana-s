"use client";

import { useActionState, useState } from "react";
import { submitLogin, type LoginState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: LoginState = { error: "" };

export function LoginForm() {
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState(submitLogin, empty);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 pt-16">
      <Card className="w-full">
        <CardTitle>Mochi & Friends</CardTitle>
        <CardDescription>
          {creating
            ? "Create a parent account with your name and a password. Each parent needs a different name. Next you start a family, or join with a code."
            : "Parents sign in with a name and a password. Yana's home opens next."}
        </CardDescription>
        <form className="mt-6 space-y-4" action={action}>
          <input type="hidden" name="intent" value={creating ? "create" : "sign-in"} />
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" name="name" autoComplete="username" minLength={2} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={creating ? "new-password" : "current-password"}
              minLength={8}
              required
            />
            <button type="button" className="text-sm underline" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remember" defaultChecked />
            Remember this device
          </label>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Please wait…" : creating ? "Create account" : "Sign in"}
          </Button>
          <button
            type="button"
            className="block text-sm underline"
            onClick={() => setCreating((value) => !value)}
          >
            {creating ? "Already have an account? Sign in" : "New parent? Create an account"}
          </button>
          <p className="text-sm text-muted-foreground">
            Second parent: create an account, then enter the code from Setup. Join with a code is the next page.
          </p>
          <p className="text-sm text-muted-foreground">Forgot the password? The other parent can set a new one from Setup.</p>
          <p className="text-sm text-muted-foreground">Your name, the family, school messages, and Yana&apos;s progress stay in this account. There are no ads.</p>
        </form>
      </Card>
    </main>
  );
}
