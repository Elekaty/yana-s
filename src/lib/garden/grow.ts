import { revalidatePath } from "next/cache";

export async function growGarden(
  supabase: { rpc: (fn: string, args: { p_child: string }) => PromiseLike<{ data: unknown }> },
  childId: string,
) {
  const { data } = await supabase.rpc("plant_next", { p_child: childId });
  if (typeof data !== "string" || data === "") return "";
  revalidatePath("/kid/garden");
  return data;
}
