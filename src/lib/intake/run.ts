import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { processNextClassify } from "@/lib/intake/classify";
import { processNextRoster } from "@/lib/plan/roster";
import { processNextScan } from "@/lib/scan/process";

export async function processNextQueued() {
  const admin = createAdminClient();
  const { data: job } = await admin
    .from("jobs")
    .select("id, family_id, kind, payload, attempts")
    .eq("status", "queued")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!job?.family_id) return { processed: false };
  if (job.kind === "classify") {
    return processNextClassify({
      id: job.id as string,
      family_id: job.family_id as string,
      payload: job.payload,
      attempts: job.attempts as number,
    });
  }
  if (job.kind === "roster") return processNextRoster(job.family_id as string);
  if (job.kind === "scan") {
    const scanId = (job.payload as { scan_id?: string }).scan_id;
    return processNextScan(job.family_id as string, scanId);
  }
  return { processed: false };
}
