"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { lockAndGoToKid } from "@/app/parent/unlock/actions";

export function ModeSwitch() {
  const path = usePathname();
  const parent = path.startsWith("/parent");
  const kid = path.startsWith("/kid");

  return (
    <div className="flex h-16 items-center gap-3 rounded-full border border-grape/20 bg-white px-1 shadow-md" role="group" aria-label="Parent or kid mode">
      {parent ? (
        <span aria-current="page" className={on}>Parent</span>
      ) : (
        <Link href="/parent/unlock" className={off}>Parent</Link>
      )}
      {kid ? (
        <span aria-current="page" className={on}>Kid</span>
      ) : (
        <form action={lockAndGoToKid}>
          <button type="submit" className={off}>Kid</button>
        </form>
      )}
    </div>
  );
}

const on = "flex h-16 min-w-16 items-center justify-center rounded-full bg-sun px-3 text-sm font-semibold text-plum";
const off = "flex h-16 min-w-16 items-center justify-center rounded-full px-3 text-sm font-semibold text-plum/70";
