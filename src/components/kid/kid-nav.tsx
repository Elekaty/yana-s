"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons: Record<string, string> = {
  "/kid/home": "🐱",
  "/kid/homework": "✏️",
  "/kid/games": "🎮",
};

export function KidNav({ links }: { links: readonly (readonly [string, string])[] }) {
  const path = usePathname();
  return (
    <nav className="grid grid-cols-3 gap-2 border-t border-white/10 bg-[#1a062c]/80 p-2 min-[820px]:w-56 min-[820px]:grid-cols-1 min-[820px]:border-t-0 min-[820px]:border-l min-[820px]:pt-16" aria-label="Yana">
      {links.map(([label, href]) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex h-14 items-center justify-center gap-2 rounded-full bg-sun text-lg font-semibold text-plum shadow-[0_6px_0_#e0b520]"
                : "flex h-14 items-center justify-center gap-2 rounded-full bg-white/10 text-lg text-white"
            }
          >
            <span aria-hidden>{icons[href] ?? "★"}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
