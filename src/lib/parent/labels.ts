export function homeworkLabel(
  scanStatus: string | null,
  taskStatus: string | null,
  flagged: boolean,
  step?: { current: number; total: number } | null,
  onBreak = false,
) {
  if (onBreak && !scanStatus) return "No scan needed on this break";
  if (!scanStatus) return "Not scanned";
  if (flagged || taskStatus === "stuck" || taskStatus === "needs_you") return "Stuck, needs you";
  if (taskStatus === "completed" || taskStatus === "done") return "Done";
  if (step && step.total > 0 && (taskStatus || step.current > 0)) return `In progress (step ${step.current} of ${step.total})`;
  if (taskStatus) return "In progress";
  return "Scanned, not started";
}

export function tonightLine(plan: { leaderName: string; start: string; duration: number; voiceNote: boolean; role?: string }) {
  if (plan.role === "break") return `Break: ${plan.duration} min of games and reading`;
  if (plan.voiceNote) return `${plan.leaderName} solo, ${plan.duration} min, plus a voice note`;
  return `${plan.leaderName}, ${plan.start}, ${plan.duration} min`;
}
