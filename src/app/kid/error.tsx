"use client";

import { useEffect } from "react";
import { logError } from "@/lib/log";

export default function KidError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("kid", error);
  }, [error]);
  return (
    <div className="grid gap-4">
      <p className="text-center text-2xl">Ça n&apos;a pas marché.</p>
      <button type="button" onClick={reset} className="flex h-16 items-center justify-center rounded-full bg-sun text-2xl text-plum">
        Encore
      </button>
    </div>
  );
}
