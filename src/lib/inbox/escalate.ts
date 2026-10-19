import "server-only";

import { notifyParents } from "@/lib/calendar/due";
import { arrivalTargets, digestBody, progressBody } from "@/lib/notify/copy";
import { createAdminClient } from "@/lib/supabase/admin";
import { digestKind, escalationTargets } from "@/lib/inbox/sort";

export async function runEscalations(now = new Date()) {
  const admin = createAdminClient();
  const since = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const { data: messages, error } = await admin
    .from("messages")
    .select("id, family_id, created_at")
    .eq("tier", "urgent")
    .eq("status", "new")
    .lte("created_at", since);
  if (error || !messages) return 0;

  let sent = 0;
  for (const message of messages) {
    const familyId = message.family_id as string;
    const [{ data: parents }, { data: acks }, { data: prior }] = await Promise.all([
      admin.from("members").select("id").eq("family_id", familyId).eq("role", "parent"),
      admin.from("message_acks").select("member_id").eq("message_id", message.id),
      admin.from("message_alerts").select("member_id").eq("message_id", message.id).eq("kind", "escalation"),
    ]);
    const ticked = new Set((acks ?? []).map((ack) => ack.member_id as string));
    const targets = escalationTargets({
      tier: "urgent",
      status: "new",
      createdAt: message.created_at as string,
      now: now.toISOString(),
      parents: (parents ?? []).map((parent) => ({ id: parent.id as string, ticked: ticked.has(parent.id as string) })),
      alreadySent: (prior ?? []).map((alert) => alert.member_id as string),
    });
    for (const memberId of targets) {
      const inserted = await admin.from("message_alerts").insert({
        family_id: familyId,
        message_id: message.id,
        member_id: memberId,
        kind: "escalation",
      });
      if (!inserted.error) sent += 1;
    }
    if (targets.length > 0) await notifyParents(familyId, "An urgent school message is still waiting for a parent.");
  }
  await markDigests(now);
  return sent;
}

export async function alertUrgentArrival(familyId: string, messageId: string, title: string) {
  const admin = createAdminClient();
  const [{ data: parents }, { data: prior }] = await Promise.all([
    admin.from("members").select("id").eq("family_id", familyId).eq("role", "parent"),
    admin.from("message_alerts").select("member_id").eq("message_id", messageId).eq("kind", "arrival"),
  ]);
  const targets = arrivalTargets(
    (parents ?? []).map((parent) => ({ id: parent.id as string })),
    (prior ?? []).map((alert) => alert.member_id as string),
  );
  let sent = 0;
  for (const memberId of targets) {
    const inserted = await admin.from("message_alerts").insert({
      family_id: familyId,
      message_id: messageId,
      member_id: memberId,
      kind: "arrival",
    });
    if (!inserted.error) sent += 1;
  }
  if (sent > 0) await notifyParents(familyId, title.trim() || "An urgent school message just arrived.");
  return sent;
}

async function markDigests(now: Date) {
  const admin = createAdminClient();
  const { data: families } = await admin.from("families").select("id, timezone");
  for (const family of families ?? []) {
    const zone = (family.timezone as string) || "Europe/Paris";
    const kind = digestKind(now, zone);
    if (!kind) continue;
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(now);
    const marked = await admin.from("digest_marks").insert({ family_id: family.id, kind, day });
    if (marked.error) continue;
    const { data: notes } = await admin
      .from("messages")
      .select("title, summary_en")
      .eq("family_id", family.id)
      .eq("tier", kind)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(8);
    const titles = (notes ?? []).map((note) => (note.title as string) || (note.summary_en as string) || "School note");
    await notifyParents(family.id as string, digestBody(kind, titles));
    if (kind !== "fyi") continue;
    const progress = await admin.from("digest_marks").insert({ family_id: family.id, kind: "progress", day });
    if (progress.error) continue;
    await notifyParents(family.id as string, progressBody(await weekProgress(family.id as string, now)));
  }
}

async function weekProgress(familyId: string, now: Date) {
  const admin = createAdminClient();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: games }, { data: homework }, { data: child }] = await Promise.all([
    admin.from("game_sessions").select("id").eq("family_id", familyId).gte("created_at", since),
    admin.from("homework_runs").select("id").eq("family_id", familyId).eq("status", "done").gte("updated_at", since),
    admin.from("children").select("star_balance").eq("family_id", familyId).limit(1).maybeSingle(),
  ]);
  return {
    homework: homework?.length ?? 0,
    games: games?.length ?? 0,
    stars: Number(child?.star_balance ?? 0),
  };
}
