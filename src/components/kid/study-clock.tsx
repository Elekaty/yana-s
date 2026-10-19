"use client";

import { createContext, useContext } from "react";
import type { StudyClock } from "@/lib/study/clock";

export const StudyClockContext = createContext<StudyClock | null>(null);

export function useStudyClock(fallback: StudyClock | null) {
  const live = useContext(StudyClockContext);
  return live ?? fallback;
}
