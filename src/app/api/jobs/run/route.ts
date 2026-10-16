import { NextResponse } from "next/server";
import { getFamily } from "@/lib/family";
import { createAdminClient } from "@/lib/supabase/admin";
import { processNextScan } from "@/lib/scan/process";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { scanId?: string; familyId?: string };
  const header = request.headers.get("authorization") ?? "";
  const cron = process.env.CRON_SECRET && header === `Bearer ${process.env.CRON_SECRET}`;

  let familyId = "";
  if (cron) {
    familyId = body.familyId ?? (await nextQueuedFamily());
    if (!familyId) return NextResponse.json({ processed: false });
  } else {
    const { user, family } = await getFamily();
    if (!user || !family || family.my_role !== "parent") {
      return NextResponse.json({ error: "Parents only" }, { status: 401 });
    }
    familyId = family.family_id;
  }

  try {
    const result = await processNextScan(familyId, body.scanId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "could not read" }, { status: 422 });
  }
}

async function nextQueuedFamily() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("jobs")
    .select("family_id")
    .eq("kind", "scan")
    .eq("status", "queued")
    .order("run_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data?.family_id as string | undefined) ?? "";
}
