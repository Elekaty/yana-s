export const LOGIN_GUARD_COOKIE = "mf_login_guard";
export const LOGIN_LOCK_SECONDS = 5 * 60;
export const LOGIN_MAX_TRIES = 5;

export type LoginGuard = { fails: number; until: number };

export function nextLoginGuard(current: LoginGuard, nowSeconds: number, correct: boolean): LoginGuard {
  if (correct) return { fails: 0, until: 0 };
  const fails = current.fails + 1;
  if (fails >= LOGIN_MAX_TRIES) return { fails, until: Math.floor(nowSeconds) + LOGIN_LOCK_SECONDS };
  return { fails, until: 0 };
}

export function loginLocked(guard: LoginGuard, nowSeconds: number) {
  return guard.until > nowSeconds;
}
