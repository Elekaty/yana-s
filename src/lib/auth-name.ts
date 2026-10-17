export function parentLoginEmail(name: string): string | null {
  const trimmed = name.trim().toLowerCase();
  if (trimmed.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
  }
  const slug = trimmed
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
  if (slug.length < 2) return null;
  return `${slug}@signin.yana-s.app`;
}
