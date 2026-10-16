import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const index = line.indexOf("=");
  if (index === -1) continue;
  const key = line.slice(0, index);
  if (!process.env[key]) process.env[key] = line.slice(index + 1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await supabase.from("families").select("id").limit(1);
if (error) {
  console.error(error.message);
  console.error("Apply supabase/migrations/0001_core.sql in the Supabase SQL editor, then run this again.");
  process.exit(1);
}

console.log("Database is reachable. Create the family from the app. Nothing was inserted.");
