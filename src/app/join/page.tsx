"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFamily, joinFamily, type FormState } from "@/app/join/actions";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const empty: FormState = { error: "" };

export default function JoinPage() {
  const timezoneRef = useRef<HTMLInputElement>(null);
  const [created, createAction, creating] = useActionState(createFamily, empty);
  const [joined, joinAction, joining] = useActionState(joinFamily, empty);

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezoneRef.current && zone) timezoneRef.current.value = zone;
  }, []);

  return (
    <main className="mx-auto grid min-h-dvh max-w-4xl gap-4 px-4 py-8 pt-16 min-[820px]:grid-cols-2">
      <Card>
        <CardTitle>Start your family</CardTitle>
        <CardDescription>The first parent sets the name and the PIN.</CardDescription>
        <form action={createAction} className="mt-4 space-y-3">
          <input ref={timezoneRef} type="hidden" name="timezone" defaultValue="Europe/Paris" />
          <Field id="familyName" label="Family name" />
          <Field id="createDisplayName" name="displayName" label="Your name" />
          <Field id="childName" label="Child's name" defaultValue="Yana" />
          <div className="space-y-2">
            <Label htmlFor="pin">Parent PIN</Label>
            <Input id="pin" name="pin" inputMode="numeric" autoComplete="off" minLength={4} maxLength={6} required />
          </div>
          {created.error ? <p className="text-sm text-red-600">{created.error}</p> : null}
          <Button type="submit" disabled={creating}>
            {creating ? "Saving…" : "Create family"}
          </Button>
        </form>
      </Card>
      <Card>
        <CardTitle>Join with a code</CardTitle>
        <CardDescription>The second parent uses the code from Setup.</CardDescription>
        <form action={joinAction} className="mt-4 space-y-3">
          <Field id="joinDisplayName" name="displayName" label="Your name" />
          <Field id="code" label="Invite code" />
          {joined.error ? <p className="text-sm text-red-600">{joined.error}</p> : null}
          <Button type="submit" disabled={joining}>
            {joining ? "Joining…" : "Join family"}
          </Button>
        </form>
      </Card>
    </main>
  );
}

function Field({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name?: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name ?? id} defaultValue={defaultValue} required />
    </div>
  );
}
