"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function KidNav({ links }: { links: readonly (readonly [string, string])[] }) {
  const path = usePathname();
  return (
    <nav className="grid grid-cols-3 border-t border-white/15 min-[820px]:w-48 min-[820px]:grid-cols-1 min-[820px]:border-t-0 min-[820px]:border-l min-[820px]:pt-16" aria-label="Yana">
      {links.map(([label, href]) => {
        const active = path === href || path.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex h-14 items-center justify-center bg-sun text-lg font-semibold text-plum"
                : "flex h-14 items-center justify-center text-lg text-white/80"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
