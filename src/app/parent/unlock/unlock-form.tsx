"use client";

import { useActionState } from "react";
import { setPin, verifyPin, type PinState } from "@/app/parent/unlock/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: PinState = { error: "" };

export function UnlockForm({ hasPin }: { hasPin: boolean }) {
  const action = hasPin ? verifyPin : setPin;
  const [state, formAction, pending] = useActionState(action, empty);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 pt-16">
      <Card className="w-full">
        <CardTitle>{hasPin ? "Parent area" : "Choose a PIN"}</CardTitle>
        <CardDescription>
          {hasPin ? "Enter the family PIN. Leaving this area locks it again." : "Both parents will use this PIN."}
        </CardDescription>
        <form action={formAction} className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input id="pin" name="pin" inputMode="numeric" autoComplete="off" minLength={4} maxLength={6} required />
          </div>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Checking…" : hasPin ? "Unlock" : "Save PIN"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
