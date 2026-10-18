"use client";

import { ErrorState } from "@/components/parent/screen-state";

export default function ParentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="This page did not load" body="The family data could not be read." onRetry={reset} />;
}
