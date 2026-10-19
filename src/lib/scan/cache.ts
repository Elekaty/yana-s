export function reuseReadyScan(prior: { status: string; hasTask: boolean } | null) {
  return Boolean(prior && prior.status === "ready" && prior.hasTask);
}
