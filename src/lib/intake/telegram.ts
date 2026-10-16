export type TelegramFile = {
  fileId: string;
  uniqueId: string;
  mime: string;
  name: string;
};

export type TelegramNote = {
  chatId: string;
  chatTitle: string;
  messageId: number;
  text: string;
  files: TelegramFile[];
};

export function parseTelegramNote(update: unknown): TelegramNote | null {
  if (!update || typeof update !== "object") return null;
  const message = (update as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const record = message as Record<string, unknown>;
  const chat = record.chat as { id?: number | string; title?: string } | undefined;
  if (!chat || chat.id === undefined || typeof record.message_id !== "number") return null;
  const caption = typeof record.caption === "string" ? record.caption : "";
  const text = typeof record.text === "string" ? record.text : caption;
  return {
    chatId: String(chat.id),
    chatTitle: typeof chat.title === "string" ? chat.title : "",
    messageId: record.message_id,
    text,
    files: filesFrom(record),
  };
}

function filesFrom(record: Record<string, unknown>): TelegramFile[] {
  const photos = Array.isArray(record.photo) ? record.photo : [];
  const largest = photos.at(-1) as { file_id?: string; file_unique_id?: string } | undefined;
  const files: TelegramFile[] = [];
  if (largest?.file_id && largest.file_unique_id) {
    files.push({ fileId: largest.file_id, uniqueId: largest.file_unique_id, mime: "image/jpeg", name: "photo.jpg" });
  }
  const document = record.document as { file_id?: string; file_unique_id?: string; mime_type?: string; file_name?: string } | undefined;
  if (document?.file_id && document.file_unique_id) {
    files.push({
      fileId: document.file_id,
      uniqueId: document.file_unique_id,
      mime: document.mime_type || "application/octet-stream",
      name: document.file_name || "file",
    });
  }
  return files;
}
