"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/parent/screen-state";
import { logError } from "@/lib/log";

export default function ParentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("parent", error);
  }, [error]);
  return <ErrorState title="This page did not load" body="The family data could not be read." onRetry={reset} />;
}
