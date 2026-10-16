import { NextResponse } from "next/server";
import { getFamily } from "@/lib/family";
import { retryScan } from "@/lib/scan/process";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, family } = await getFamily();
  if (!user || !family || family.my_role !== "parent") {
    return NextResponse.json({ error: "Parents only" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    await retryScan(family.family_id, id);
    return NextResponse.json({ scanId: id });
  } catch {
    return NextResponse.json({ error: "Could not retry" }, { status: 500 });
  }
}
