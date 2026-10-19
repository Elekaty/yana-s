import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageHash } from "@/lib/prizes";
import { reuseReadyScan } from "@/lib/scan/cache";
import { gameTypeFor, type GameType } from "@/lib/scan/game-type";
import { readHomeworkPhoto } from "@/lib/scan/gemini";
import { applyMath } from "@/lib/scan/math";
import { redactForModel } from "@/lib/scan/redact";
import { parseScanResult } from "@/lib/scan/schema";

const USER_INSTRUCTION =
  "Read the attached homework photo. Translate the schoolwork only. Do not repeat personal names, the school name, or street addresses.";

export async function enqueueScan(familyId: string, imagePath: string) {
  const admin = createAdminClient();
  const downloaded = await admin.storage.from("scans").download(imagePath);
  const bytes = downloaded.data ? new Uint8Array(await downloaded.data.arrayBuffer()) : null;
  const hash = bytes ? imageHash(bytes) : "";
  if (hash) {
    const prior = await admin
      .from("homework_scans")
      .select("id, status")
      .eq("family_id", familyId)
      .eq("image_hash", hash)
      .eq("status", "ready")
      .limit(1)
      .maybeSingle();
    const task = prior.data?.id
      ? await admin.from("tasks").select("id").eq("family_id", familyId).eq("scan_id", prior.data.id).limit(1).maybeSingle()
      : { data: null };
    if (reuseReadyScan(prior.data ? { status: String(prior.data.status), hasTask: Boolean(task.data?.id) } : null)) {
      const copied = await copyCachedScan(admin, familyId, imagePath, hash, prior.data!.id as string);
      if (copied) return { id: copied, cached: true as const };
    }
  }
  const scan = await insertScan(admin, familyId, imagePath, hash, "queued");
  const { error: jobError } = await admin.from("jobs").insert({
    family_id: familyId,
    kind: "scan",
    payload: { scan_id: scan.id, image_path: imagePath },
    status: "queued",
  });
  if (jobError) throw new Error(jobError.message);
  return { id: scan.id, cached: false as const };
}

async function copyCachedScan(
  admin: ReturnType<typeof createAdminClient>,
  familyId: string,
  imagePath: string,
  hash: string,
  priorId: string,
) {
  const { data: task } = await admin
    .from("tasks")
    .select("id, title, subject, translated_objective, parent_action, curriculum_skill, confidence, coaching, reward_stars")
    .eq("family_id", familyId)
    .eq("scan_id", priorId)
    .limit(1)
    .maybeSingle();
  if (!task) return "";
  const scan = await insertScan(admin, familyId, imagePath, hash, "ready");
  const coaching = { ...((task.coaching as Record<string, unknown> | null) ?? {}), from_cache: true };
  const { data: created, error } = await admin
    .from("tasks")
    .insert({
      family_id: familyId,
      scan_id: scan.id,
      title: task.title,
      subject: task.subject,
      translated_objective: task.translated_objective,
      parent_action: task.parent_action,
      curriculum_skill: task.curriculum_skill,
      confidence: task.confidence,
      coaching,
      status: "pending",
      reward_stars: task.reward_stars,
    })
    .select("id")
    .single();
  if (error || !created) return scan.id;
  const { data: games } = await admin.from("mini_games").select("game_type, game_data").eq("task_id", task.id);
  for (const game of games ?? []) {
    await insertMiniGame(admin, {
      family_id: familyId,
      task_id: created.id as string,
      game_type: game.game_type as GameType,
      game_data: game.game_data,
    });
  }
  return scan.id;
}

async function insertScan(
  admin: ReturnType<typeof createAdminClient>,
  familyId: string,
  imagePath: string,
  hash: string,
  status: string,
) {
  const withHash = await admin
    .from("homework_scans")
    .insert({ family_id: familyId, image_path: imagePath, status, image_hash: hash || null })
    .select("id")
    .single();
  if (!withHash.error && withHash.data) return { id: withHash.data.id as string, cached: true };
  if (withHash.error && /image_hash/i.test(withHash.error.message)) {
    const plain = await admin.from("homework_scans").insert({ family_id: familyId, image_path: imagePath, status: "queued" }).select("id").single();
    if (plain.error || !plain.data) throw new Error(plain.error?.message ?? "Could not save the scan");
    return { id: plain.data.id as string, cached: false };
  }
  throw new Error(withHash.error?.message ?? "Could not save the scan");
}

export async function retryScan(familyId: string, scanId: string) {
  const admin = createAdminClient();
  const { data: scan, error } = await admin
    .from("homework_scans")
    .select("id, image_path")
    .eq("id", scanId)
    .eq("family_id", familyId)
    .single();
  if (error || !scan) throw new Error("Scan not found");
  await admin.from("tasks").delete().eq("scan_id", scanId).eq("family_id", familyId);
  await admin.from("homework_scans").update({ status: "queued" }).eq("id", scanId);
  const { error: jobError } = await admin.from("jobs").insert({
    family_id: familyId,
    kind: "scan",
    payload: { scan_id: scanId, image_path: scan.image_path },
    status: "queued",
  });
  if (jobError) throw new Error(jobError.message);
}

export async function processNextScan(familyId: string, scanId?: string) {
  const admin = createAdminClient();
  const { data: jobs, error } = await admin
    .from("jobs")
    .select("id, payload, attempts")
    .eq("family_id", familyId)
    .eq("kind", "scan")
    .eq("status", "queued")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true });
  if (error) throw new Error(error.message);
  const job = (jobs ?? []).find((item) => !scanId || (item.payload as { scan_id?: string }).scan_id === scanId);
  if (!job) return { processed: false };

  await admin.from("jobs").update({ status: "running", attempts: (job.attempts ?? 0) + 1 }).eq("id", job.id);
  const payload = job.payload as { scan_id: string; image_path: string };
  await admin.from("homework_scans").update({ status: "reading" }).eq("id", payload.scan_id);

  try {
    const { data: file, error: downloadError } = await admin.storage.from("scans").download(payload.image_path);
    if (downloadError || !file) throw new Error("Could not open the saved photo");
    const names = await familyNames(admin, familyId);
    const raw = await readHomeworkPhoto(Buffer.from(await file.arrayBuffer()), redactForModel(USER_INSTRUCTION, names));
    const parsed = applyMath(parseScanResult(raw));
    await admin.from("tasks").delete().eq("scan_id", payload.scan_id).eq("family_id", familyId);
    const reward = parsed.result.child_ui.tasks.reduce((sum, task) => sum + task.reward_stars, 0);
    const { data: task, error: taskError } = await admin
      .from("tasks")
      .insert({
        family_id: familyId,
        scan_id: payload.scan_id,
        title: parsed.result.child_ui.island_title,
        subject: parsed.result.parent_dashboard.subject,
        translated_objective: parsed.result.parent_dashboard.translated_objective,
        parent_action: parsed.result.parent_dashboard.parent_action,
        curriculum_skill: parsed.result.parent_dashboard.curriculum_skill,
        confidence: parsed.result.parent_dashboard.confidence,
        coaching: {
          questions: parsed.result.parent_questions,
          unclear_note: parsed.result.parent_dashboard.unclear_note,
          flagged: parsed.flagged,
        },
        status: "pending",
        reward_stars: reward,
      })
      .select("id")
      .single();
    if (taskError || !task) throw new Error(taskError?.message ?? "Could not save the task");

    for (const mini of parsed.result.child_ui.tasks) {
      const gameType = gameTypeFor(mini.type);
      const saved = await insertMiniGame(admin, {
        family_id: familyId,
        task_id: task.id,
        game_type: gameType,
        game_data: mini,
      });
      if (!saved) throw new Error("Could not save a mini-task");
    }

    await admin.from("homework_scans").update({ status: "ready" }).eq("id", payload.scan_id);
    await admin.from("jobs").update({ status: "succeeded" }).eq("id", job.id);
    return { processed: true, scanId: payload.scan_id };
  } catch (cause) {
    await admin.from("homework_scans").update({ status: "failed" }).eq("id", payload.scan_id);
    await admin.from("jobs").update({ status: "failed" }).eq("id", job.id);
    throw cause;
  }
}

async function insertMiniGame(
  admin: SupabaseClient,
  row: { family_id: string; task_id: string; game_type: GameType; game_data: unknown },
) {
  const first = await admin.from("mini_games").insert(row);
  if (!first.error) return true;
  if (!first.error.message.includes("invalid input value for enum")) return false;
  const fallback = row.game_type === "write" ? "physical" : "flashcard";
  const second = await admin.from("mini_games").insert({ ...row, game_type: fallback });
  return !second.error;
}

async function familyNames(admin: SupabaseClient, familyId: string) {
  const [{ data: children }, { data: members }] = await Promise.all([
    admin.from("children").select("name").eq("family_id", familyId),
    admin.from("members").select("display_name").eq("family_id", familyId),
  ]);
  return [...(children ?? []).map((row) => row.name as string), ...(members ?? []).map((row) => row.display_name as string)];
}
