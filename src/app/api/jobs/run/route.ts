import { NextResponse } from "next/server";
import { getFamily } from "@/lib/family";
import { processNextQueued } from "@/lib/intake/run";
import { runEscalations } from "@/lib/inbox/escalate";
import { processNextScan } from "@/lib/scan/process";

export const maxDuration = 60;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { scanId?: string; familyId?: string };
  const header = request.headers.get("authorization") ?? "";
  const cron = process.env.CRON_SECRET && header === `Bearer ${process.env.CRON_SECRET}`;

  if (cron) {
    try {
      const result = body.familyId
        ? await processNextScan(body.familyId, body.scanId)
        : await processNextQueued();
      const escalated = await runEscalations().catch(() => 0);
      return NextResponse.json({ ...result, escalated });
    } catch {
      return NextResponse.json({ processed: false }, { status: 500 });
    }
  }

  const { user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") {
    return NextResponse.json({ error: "Parents only" }, { status: 401 });
  }

  try {
    const result = await processNextScan(family.family_id, body.scanId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "could not read" }, { status: 422 });
  }
}
