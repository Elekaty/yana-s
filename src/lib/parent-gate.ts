export type GateDecision = { redirectTo?: string; clearUnlock: boolean; deny?: boolean };

export function isParentScanApi(path: string) {
  return path === "/api/scans" || /^\/api\/scans\/[^/]+\/retry$/.test(path);
}

export function decideGate(path: string, hasUser: boolean, unlockValid: boolean): GateDecision {
  if (!hasUser && isParentScanApi(path)) return { redirectTo: undefined, clearUnlock: false, deny: true };
  if (hasUser && path === "/login") return { redirectTo: "/", clearUnlock: false };
  const needsUser = path.startsWith("/parent") || path.startsWith("/kid") || path.startsWith("/join");
  if (!hasUser && needsUser) return { redirectTo: "/login", clearUnlock: false };
  const parentGate = path.startsWith("/parent") && !path.startsWith("/parent/unlock");
  if (hasUser && parentGate && !unlockValid) return { redirectTo: "/parent/unlock", clearUnlock: false };
  return { clearUnlock: hasUser && (path === "/kid" || path.startsWith("/kid/")) };
}
