"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Scan", "/parent"],
  ["Inbox", "/parent/inbox"],
  ["Calendar", "/parent/calendar"],
  ["To do", "/parent/todo"],
  ["Progress", "/parent/progress"],
  ["Setup", "/parent/setup"],
] as const;

export function ParentTabs() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Parents">
      {links.map(([label, href]) => {
        const active = href === "/parent" ? path === "/parent" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "shrink-0 rounded-full bg-sun px-4 py-2 text-sm font-semibold text-plum"
                : "shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
