export function homeworkLabel(scanStatus: string | null, taskStatus: string | null, flagged: boolean) {
  if (!scanStatus) return "Not scanned";
  if (flagged) return "Stuck, needs you";
  if (taskStatus === "completed" || taskStatus === "done") return "Done";
  if (taskStatus) return "In progress";
  return "Scanned, not started";
}

export function tonightLine(plan: { leaderName: string; start: string; duration: number; voiceNote: boolean }) {
  if (plan.voiceNote) return `${plan.leaderName} solo, ${plan.duration} min, plus a voice note`;
  return `${plan.leaderName}, ${plan.start}, ${plan.duration} min`;
}
