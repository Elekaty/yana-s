"use client";

import { useEffect } from "react";
import { logError } from "@/lib/log";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("app", error);
  }, [error]);
  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">This page did not load</h1>
      <p className="mt-2 text-sm">Try again. Nothing was sent to a tracker.</p>
      <button type="button" onClick={reset} className="mt-4 inline-flex h-12 items-center rounded-full bg-plum px-4 text-sm font-semibold text-white">
        Try again
      </button>
    </main>
  );
}
