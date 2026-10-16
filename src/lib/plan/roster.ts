import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractRosterDays } from "@/lib/plan/extract";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export async function saveRosterFile(familyId: string, memberId: string, file: { name: string; bytes: Buffer; mime: string }) {
  const admin = createAdminClient();
  const extension = Object.entries(MIME).find(([, mime]) => mime === file.mime)?.[0] ?? "jpg";
  const path = `${familyId}/roster/${randomUUID()}.${extension}`;
  const uploaded = await admin.storage.from("scans").upload(path, file.bytes, { contentType: file.mime, upsert: false });
  if (uploaded.error) throw new Error(uploaded.error.message);
  const { error } = await admin.from("jobs").insert({
    family_id: familyId,
    kind: "roster",
    payload: { member_id: memberId, image_path: path, mime: file.mime },
    status: "queued",
  });
  if (error) throw new Error(error.message);
}

export async function processNextRoster(familyId?: string) {
  const admin = createAdminClient();
  let query = admin
    .from("jobs")
    .select("id, family_id, payload, attempts")
    .eq("kind", "roster")
    .eq("status", "queued")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(1);
  if (familyId) query = query.eq("family_id", familyId);
  const { data: job } = await query.maybeSingle();
  if (!job?.family_id) return { processed: false };

  const attempts = (job.attempts ?? 0) + 1;
  await admin.from("jobs").update({ status: "running", attempts }).eq("id", job.id);
  const payload = job.payload as { member_id?: string; image_path?: string; mime?: string };
  try {
    const downloaded = await admin.storage.from("scans").download(payload.image_path ?? "");
    if (downloaded.error || !downloaded.data) throw new Error("Could not open the roster");
    const names = await familyNames(job.family_id as string);
    const days = await extractRosterDays(
      {
        mime: payload.mime || "image/jpeg",
        bytes: Buffer.from(await downloaded.data.arrayBuffer()),
      },
      names,
    );
    if (!payload.member_id) throw new Error("Missing parent");
    await admin.from("roster_drafts").delete().eq("family_id", job.family_id).eq("member_id", payload.member_id);
    if (days.length > 0) {
      const inserted = await admin.from("roster_drafts").insert(
        days.map((day) => ({
          family_id: job.family_id,
          member_id: payload.member_id,
          date: day.date,
          status: day.status,
        })),
      );
      if (inserted.error) throw new Error(inserted.error.message);
    }
    await admin.from("jobs").update({ status: "succeeded" }).eq("id", job.id);
    return { processed: true, days: days.length };
  } catch {
    await admin.from("jobs").update({ status: attempts >= 3 ? "failed" : "queued", run_at: new Date(Date.now() + attempts * 30_000).toISOString() }).eq("id", job.id);
    return { processed: true, failed: attempts >= 3 };
  }
}

export async function ensureRosterReminder(now = new Date()) {
  const admin = createAdminClient();
  const { data: families, error } = await admin.from("families").select("id, timezone");
  if (error || !families) return 0;
  let created = 0;
  for (const family of families) {
    const timeZone = (family.timezone as string) || "Europe/Paris";
    const day = Number(new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric" }).format(now));
    if (day !== 25) continue;
    const month = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).format(now);
    const { data: existing } = await admin
      .from("reminders")
      .select("id")
      .eq("family_id", family.id)
      .eq("ref_type", "roster")
      .gte("due_at", `${month}-01`)
      .limit(1);
    if ((existing ?? []).length > 0) continue;
    const inserted = await admin.from("reminders").insert({
      family_id: family.id,
      target: "parent",
      ref_type: "roster",
      due_at: now.toISOString(),
      status: "pending",
    });
    if (!inserted.error) created += 1;
  }
  return created;
}

async function familyNames(familyId: string) {
  const admin = createAdminClient();
  const [{ data: children }, { data: members }] = await Promise.all([
    admin.from("children").select("name").eq("family_id", familyId),
    admin.from("members").select("display_name").eq("family_id", familyId),
  ]);
  return [...(children ?? []).map((row) => String(row.name ?? "")), ...(members ?? []).map((row) => String(row.display_name ?? ""))];
}

export function rosterMime(name: string, type: string) {
  if (Object.values(MIME).includes(type)) return type;
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return MIME[extension] ?? "";
}
