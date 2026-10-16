export function recordingExtension(mime: string) {
  return mime.includes("mp4") ? "mp4" : "webm";
}

export function isFamilyVoicePath(familyId: string, path: string) {
  if (!familyId || path.includes("..") || path.includes("\\")) return false;
  const [folder, file, extra] = path.split("/");
  return folder === familyId && Boolean(file) && extra === undefined;
}
