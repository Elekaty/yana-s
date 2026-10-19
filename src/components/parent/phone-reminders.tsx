"use client";

import { useState } from "react";
import { savePushSubscription } from "@/app/parent/(gate)/calendar/actions";
import { Button } from "@/components/ui/button";

export function PhoneReminders({ publicKey }: { publicKey: string }) {
  const [note, setNote] = useState("");

  async function enable() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setNote("This phone cannot show reminders yet.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNote("Reminders stay off until this phone allows them.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(publicKey),
    });
    const json = subscription.toJSON();
    const body = new FormData();
    body.set("endpoint", subscription.endpoint);
    body.set("p256dh", json.keys?.p256dh ?? "");
    body.set("auth", json.keys?.auth ?? "");
    await savePushSubscription(body);
    setNote("This phone will get reminders.");
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="lg" variant="outline" onClick={() => void enable()}>
        Remind this phone
      </Button>
      {note ? <p className="text-sm">{note}</p> : null}
    </div>
  );
}

function keyBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}
