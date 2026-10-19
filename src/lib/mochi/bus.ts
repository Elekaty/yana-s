import type { MochiEvent } from "@/lib/mochi/machine";

export type MochiCue = MochiEvent | { type: "talk"; on: boolean };

const listeners = new Set<(cue: MochiCue) => void>();

export function mochiSend(cue: MochiCue) {
  for (const listener of listeners) listener(cue);
}

export function onMochi(listener: (cue: MochiCue) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function speakMs(text: string) {
  return Math.min(8000, Math.max(400, text.length * 80));
}
