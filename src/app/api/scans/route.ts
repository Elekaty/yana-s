import { NextResponse } from "next/server";
import { getFamily } from "@/lib/family";
import { enqueueScan } from "@/lib/scan/process";

export async function POST(request: Request) {
  const { user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") {
    return NextResponse.json({ error: "Parents only" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { imagePath?: string } | null;
  const imagePath = body?.imagePath ?? "";
  if (!imagePath.startsWith(`${family.family_id}/`) || imagePath.includes("..")) {
    return NextResponse.json({ error: "That photo is not in your family folder" }, { status: 400 });
  }
  try {
    const saved = await enqueueScan(family.family_id, imagePath);
    return NextResponse.json({ scanId: saved.id, cached: saved.cached });
  } catch {
    return NextResponse.json({ error: "Could not save the scan" }, { status: 500 });
  }
}
