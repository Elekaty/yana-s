"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const main = [
  ["Today", "/parent"],
  ["Inbox", "/parent/inbox"],
  ["Calendar", "/parent/calendar"],
  ["Progress", "/parent/progress"],
] as const;

const more = [
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
  const moreActive = more.some(([, href]) => path.startsWith(href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-plum px-1 py-1 text-white min-[1024px]:hidden" aria-label="Parents">
        {main.map(([label, href]) => (
          <Tab key={href} href={href} label={label} active={href === "/parent" ? path === "/parent" : path.startsWith(href)} badge={href === "/parent/inbox" ? unseen : 0} />
        ))}
        <button type="button" className={moreActive || open ? tabOn : tabOff} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          More
        </button>
      </nav>
      {open ? (
        <div className="fixed inset-x-0 bottom-16 z-30 grid gap-2 border-t border-white/10 bg-plum p-3 text-white min-[1024px]:hidden">
          {more.map(([label, href]) => (
            <Link key={href} href={href} className="flex h-12 items-center rounded-full bg-white/10 px-4" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
        </div>
      ) : null}
      <nav className="sticky top-0 hidden h-dvh flex-col gap-1 overflow-y-auto border-r border-white/10 bg-plum p-3 text-white min-[1024px]:flex" aria-label="Parents">
        {[...main, ...more].map(([label, href]) => (
          <Tab key={href} href={href} label={label} active={href === "/parent" ? path === "/parent" : path.startsWith(href)} badge={href === "/parent/inbox" ? unseen : 0} wide />
        ))}
      </nav>
    </>
  );
}

function Tab({ href, label, active, badge, wide }: { href: string; label: string; active: boolean; badge: number; wide?: boolean }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={active ? (wide ? wideOn : tabOn) : wide ? wideOff : tabOff}>
      <span>{label}</span>
      {badge > 0 ? <span className="rounded-full bg-hot px-1.5 text-xs">{badge}</span> : null}
    </Link>
  );
}

const tabOn = "flex h-12 flex-col items-center justify-center rounded-2xl bg-sun text-xs font-semibold text-plum";
const tabOff = "flex h-12 flex-col items-center justify-center rounded-2xl text-xs font-medium text-white/80";
const wideOn = "flex h-12 items-center justify-between rounded-full bg-sun px-4 text-sm font-semibold text-plum";
const wideOff = "flex h-12 items-center justify-between rounded-full px-4 text-sm font-medium text-white/80 hover:bg-white/10";
