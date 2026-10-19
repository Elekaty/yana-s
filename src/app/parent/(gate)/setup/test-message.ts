"use server";

import { redirect } from "next/navigation";
import { getFamily } from "@/lib/family";
import { incomingHash } from "@/lib/intake/mail";
import { saveIncoming } from "@/lib/intake/save";

export async function sendTestMessage() {
  const { user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") redirect("/login");
  const text = "Test note from Setup. Swimming kit on Friday. Please reply.";
  const externalId = `setup-test:${Date.now()}`;
  await saveIncoming({
    familyId: family.family_id,
    source: "email",
    externalId,
    text,
    hash: incomingHash(text, [], externalId),
    raw: { via: "setup-test" },
    files: [],
    sender: "setup-test",
  });
  redirect("/parent/inbox");
}

export async function trySchoolNote(formData: FormData) {
  const { user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") redirect("/login");
  const text = String(formData.get("text") ?? "").trim().slice(0, 4000);
  if (!text) return;
  const externalId = `setup-note:${Date.now()}`;
  await saveIncoming({
    familyId: family.family_id,
    source: "email",
    externalId,
    text,
    hash: incomingHash(text, [], externalId),
    raw: { via: "setup-note" },
    files: [],
    sender: "setup-test",
  });
  redirect("/parent/inbox");
}
