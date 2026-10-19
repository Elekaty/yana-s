const RETIRED_HOST = "yana-s-ele18.vercel.app";
const LIVE_APP = "https://yana-s.vercel.app";

export function publicAppUrl(env: { APP_URL?: string; VERCEL_PROJECT_PRODUCTION_URL?: string; VERCEL_URL?: string }) {
  const fromEnv = (env.APP_URL ?? "").replace(/\/$/, "");
  let host = "";
  try {
    host = fromEnv ? new URL(fromEnv).host : "";
  } catch {
    host = "";
  }
  if (fromEnv && host !== RETIRED_HOST) return fromEnv;
  const production = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").replace(/\/$/, "");
  if (production) return `https://${production}`;
  const deploymentHost = (env.VERCEL_URL ?? "").replace(/\/$/, "");
  if (deploymentHost) return `https://${deploymentHost}`;
  if (host === RETIRED_HOST) return LIVE_APP;
  return "";
}
