import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { afterClassifyError } from "@/lib/intake/mail";
import { summarizeSchoolNote } from "@/lib/intake/model";
import { parseClassifyResult } from "@/lib/intake/schema";
import { redactForModel } from "@/lib/scan/redact";

const IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function processNextClassify(job: { id: string; family_id: string; payload: unknown; attempts: number }) {
  const admin = createAdminClient();
  const attempts = (job.attempts ?? 0) + 1;
  const { data: claimed } = await admin
    .from("jobs")
    .update({ status: "running", attempts })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle();
  if (!claimed) return { processed: false };

  const payload = job.payload as { message_id?: string; include_image?: boolean };
  const messageId = payload.message_id ?? "";
  try {
    const { data: message } = await admin
      .from("messages")
      .select("id, original_text, family_id")
      .eq("id", messageId)
      .eq("family_id", job.family_id)
      .maybeSingle();
    if (!message) throw new Error("Message missing");
    await admin.from("messages").update({ read_status: "reading" }).eq("id", message.id);

    const names = await familyNames(job.family_id);
    const text = redactForModel(message.original_text ?? "", names);
    const image = payload.include_image ? await firstImage(job.family_id, message.id) : null;
    if (!text.trim() && !image) {
      await admin.from("messages").update({ read_status: "ready", title: "Saved", summary_en: null }).eq("id", message.id);
      await admin.from("jobs").update({ status: "succeeded" }).eq("id", job.id);
      return { processed: true };
    }

    const raw = await summarizeSchoolNote(text || "Read the attached school photo.", image ?? undefined);
    const parsed = parseClassifyResult(raw);
    await admin
      .from("messages")
      .update({ read_status: "ready", title: parsed.title, summary_en: parsed.summary_en })
      .eq("id", message.id);
    await admin.from("jobs").update({ status: "succeeded" }).eq("id", job.id);
    return { processed: true };
  } catch {
    const next = afterClassifyError(attempts);
    const runAt = new Date(Date.now() + attempts * 30_000).toISOString();
    await admin
      .from("jobs")
      .update({ status: next.job, run_at: next.job === "queued" ? runAt : new Date().toISOString() })
      .eq("id", job.id);
    await admin.from("messages").update({ read_status: next.read }).eq("id", messageId);
    return { processed: true, failed: next.read === "failed" };
  }
}

async function familyNames(familyId: string) {
  const admin = createAdminClient();
  const [{ data: children }, { data: members }] = await Promise.all([
    admin.from("children").select("name").eq("family_id", familyId),
    admin.from("members").select("display_name").eq("family_id", familyId),
  ]);
  return [...(children ?? []).map((row) => String(row.name ?? "")), ...(members ?? []).map((row) => String(row.display_name ?? ""))];
}

async function firstImage(familyId: string, messageId: string) {
  const admin = createAdminClient();
  const { data: rows } = await admin.from("attachments").select("path, mime").eq("message_id", messageId).eq("family_id", familyId);
  const image = (rows ?? []).find((row) => IMAGE.has(String(row.mime)));
  if (!image) return null;
  const downloaded = await admin.storage.from("attachments").download(image.path);
  if (downloaded.error || !downloaded.data) return null;
  return { mime: String(image.mime), bytes: Buffer.from(await downloaded.data.arrayBuffer()) };
}
