export function logError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : "unknown";
  console.error(JSON.stringify({ scope, message, at: new Date().toISOString() }));
}
