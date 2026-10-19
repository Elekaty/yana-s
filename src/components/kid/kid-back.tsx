import Link from "next/link";

export function KidBack({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-4xl">
      <span aria-hidden>‹</span>
    </Link>
  );
}
