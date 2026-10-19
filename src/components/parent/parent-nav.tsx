"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  ["Today", "/parent"],
  ["Inbox", "/parent/inbox"],
  ["Calendar", "/parent/calendar"],
  ["Progress", "/parent/progress"],
  ["To do", "/parent/todo"],
  ["Scan", "/parent/scan"],
  ["Curriculum", "/parent/curriculum"],
  ["Voice", "/parent/voice"],
  ["Rewards", "/parent/rewards"],
  ["Study and prizes", "/parent/study"],
  ["Setup", "/parent/setup"],
] as const;

export function ParentNav({ unseen }: { unseen: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl leading-none text-plum shadow-md min-[1024px]:hidden"
        aria-expanded={open}
        aria-controls="parent-menu"
        aria-label={open ? "Hide menu" : "Show menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "‹" : "›"}
      </button>
      {open ? (
        <button type="button" className="fixed inset-0 z-30 bg-black/40 min-[1024px]:hidden" aria-label="Hide menu" onClick={() => setOpen(false)} />
      ) : null}
      <nav
        id="parent-menu"
        aria-label="Parents"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100%-4.5rem))] flex-col gap-1 overflow-y-auto bg-plum p-3 pt-16 text-white transition-transform duration-200 motion-reduce:transition-none min-[1024px]:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {items.map(([label, href]) => (
          <Tab
            key={href}
            href={href}
            label={label}
            active={href === "/parent" ? path === "/parent" : path.startsWith(href)}
            badge={href === "/parent/inbox" ? unseen : 0}
            onPick={() => setOpen(false)}
          />
        ))}
      </nav>
      <nav className="sticky top-0 hidden h-dvh flex-col gap-1 overflow-y-auto border-r border-white/10 bg-plum p-3 text-white min-[1024px]:flex" aria-label="Parents">
        {items.map(([label, href]) => (
          <Tab
            key={href}
            href={href}
            label={label}
            active={href === "/parent" ? path === "/parent" : path.startsWith(href)}
            badge={href === "/parent/inbox" ? unseen : 0}
          />
        ))}
      </nav>
    </>
  );
}

function Tab({
  href,
  label,
  active,
  badge,
  onPick,
}: {
  href: string;
  label: string;
  active: boolean;
  badge: number;
  onPick?: () => void;
}) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} onClick={onPick} className={active ? wideOn : wideOff}>
      <span>{label}</span>
      {badge > 0 ? <span className="rounded-full bg-hot px-1.5 text-xs">{badge}</span> : null}
    </Link>
  );
}

const wideOn = "flex h-12 items-center justify-between rounded-full bg-sun px-4 text-sm font-semibold text-plum";
const wideOff = "flex h-12 items-center justify-between rounded-full px-4 text-sm font-medium text-white/80 hover:bg-white/10";
