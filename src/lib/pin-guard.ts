export const PIN_GUARD_COOKIE = "mf_pin_guard";
export const PIN_LOCK_SECONDS = 15 * 60;
export const PIN_MAX_TRIES = 5;

export type PinGuard = { fails: number; until: number };

export function nextPinGuard(current: PinGuard, nowSeconds: number, correct: boolean): PinGuard {
  if (correct) return { fails: 0, until: 0 };
  const fails = current.fails + 1;
  if (fails >= PIN_MAX_TRIES) return { fails, until: Math.floor(nowSeconds) + PIN_LOCK_SECONDS };
  return { fails, until: 0 };
}

export function pinLocked(guard: PinGuard, nowSeconds: number) {
  return guard.until > nowSeconds;
}
