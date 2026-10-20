export function taskFromMessage(message: { title?: string | null; summary_en?: string | null; original_text?: string | null }) {
  const line = String(message.original_text ?? "")
    .split("\n")
    .map((row) => row.trim())
    .find(Boolean) ?? "";
  const title = (String(message.title ?? "").trim() || line || "To do").slice(0, 140);
  const summary = String(message.summary_en ?? "").trim();
  const parentAction = summary || (line && line !== title ? line : "");
  return { title, parentAction: parentAction ? parentAction.slice(0, 280) : null };
}
