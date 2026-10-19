import { spawn } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(join(root, ".env.local"));

const base = "http://localhost:3000";
const familyName = "P10 audit";
const routes = [
  ["/parent", "Needs you"],
  ["/parent/inbox", "Inbox"],
  ["/parent/calendar", "Calendar"],
  ["/parent/todo", "To do"],
  ["/parent/progress", "This week"],
  ["/parent/scan", "Scan homework"],
  ["/parent/curriculum", "Curriculum"],
  ["/parent/voice", "Voice"],
  ["/parent/rewards", "Rewards"],
  ["/parent/study", "Study and prizes"],
  ["/parent/setup", "Checklist"],
  ["/parent/setup/status", "Setup checklist"],
  ["/parent/calendar/confirm", "Add to calendar"],
  ["/parent/unlock", "Parent area"],
];
const privateMarks = ["All caught up", "No messages yet", "Invite the other parent", "Needs you"];

const browser = await chromium.launch({ headless: true });
const errors = [];
const orphanIds = new Set();
const report = { signedOut: [], locked: [], open: [], focus: null, contrast: [], calm: false, wide: false, dark: false, lighthouse: null };

try {
  report.signedOut = await visitSignedOut();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 240)));
  page.on("console", (msg) => {
    const text = msg.text();
    if (/hydration|did not match/i.test(text)) errors.push(`${page.url()} ${text}`.slice(0, 700));
  });
  await createFamily(page);
  rememberUser(await context.cookies());
  report.locked = await visitLocked(context, page);
  report.open = await visitOpen(page);
  report.focus = await focusRing(page);
  report.contrast = await contrast(page);
  report.calm = await reducedMotion(page);
  report.wide = await wideLayout(page);
  report.dark = await darkTheme(page);
  report.lighthouse = await phoneProfile(await context.cookies()).catch((error) => ({ failed: scrub(String(error)) }));
  await context.close();
} catch (error) {
  errors.push(scrub(String(error)));
} finally {
  report.cleanup = await removeAudit();
  await browser.close();
}

report.errors = errors.map((item) => item.slice(0, 160));
console.log(JSON.stringify(report));
const leaked = report.signedOut.some((row) => !row.closed) || report.locked.some((row) => !row.closed);
const missing = report.open.some((row) => !row.shown);
const faint = report.contrast.some((row) => row.ratio < 4.5);
const lightOk = report.lighthouse && !report.lighthouse.failed && String(report.lighthouse.finalUrl || "").includes("/parent");
if (leaked || missing || faint || !report.focus || !report.calm || !report.wide || !report.dark || report.errors.length || !lightOk) {
  process.exitCode = 1;
}

async function visitSignedOut() {
  const rows = [];
  for (const [route] of routes) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${route} ${error}`.slice(0, 160)));
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForURL(/\/(join|login)(\?|$)/, { timeout: 20000 }).catch(() => null);
    const text = await page.locator("body").innerText();
    const closed = /\/(join|login)/.test(new URL(page.url()).pathname) && !privateMarks.some((mark) => text.includes(mark));
    rows.push({ route, path: new URL(page.url()).pathname, closed });
    rememberUser(await context.cookies());
    await context.close();
  }
  return rows;
}

async function createFamily(page) {
  await page.goto(`${base}/join`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByRole("button", { name: "Create family" }).waitFor({ timeout: 20000 });
  await page.locator("#familyName").fill(familyName);
  await page.locator("#childName").fill("Yana");
  await page.locator("#pin").fill("4680");
  await page.getByRole("button", { name: "Create family" }).click();
  await page.waitForURL("**/kid/**", { timeout: 45000 });
}

async function visitLocked(context, page) {
  const kept = (await context.cookies()).filter((cookie) => cookie.name !== "mf_parent_unlock");
  await context.clearCookies();
  if (kept.length > 0) await context.addCookies(kept);
  const rows = [];
  for (const [route] of routes) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.getByText("Enter the family PIN").waitFor({ timeout: 20000 }).catch(() => null);
    const text = await page.locator("body").innerText();
    const path = new URL(page.url()).pathname;
    const closed = path === "/parent/unlock" && text.includes("Enter the family PIN") && !text.includes("All caught up") && !text.includes("No messages yet");
    rows.push({ route, path, closed });
  }
  return rows;
}

async function visitOpen(page) {
  await page.goto(`${base}/parent/unlock`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.locator("#pin").fill("4680");
  await page.getByRole("button", { name: "Unlock" }).click();
  await page.getByText("Needs you").waitFor({ timeout: 45000 });
  const rows = [];
  for (const [route, marker] of routes) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
    const shown = await page.getByText(marker, { exact: false }).first().waitFor({ timeout: 45000 }).then(() => true).catch(() => false);
    rows.push({ route, path: new URL(page.url()).pathname, shown });
  }
  return rows;
}

async function focusRing(page) {
  await page.goto(`${base}/parent`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByText("Needs you").waitFor({ timeout: 45000 });
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const node = document.activeElement;
    if (!node || node === document.body) return null;
    const style = getComputedStyle(node);
    const outlined = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2;
    const ring = style.boxShadow !== "none";
    return outlined || ring ? node.tagName : null;
  });
}

async function contrast(page) {
  await page.goto(`${base}/parent`, { waitUntil: "domcontentloaded", timeout: 45000 });
  const samples = await page.evaluate(() => {
    const pair = (node) => {
      if (!node) return null;
      let current = node;
      let bg = "rgba(0, 0, 0, 0)";
      while (current && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
        bg = getComputedStyle(current).backgroundColor;
        current = current.parentElement;
      }
      return { color: getComputedStyle(node).color, bg };
    };
    return [pair(document.querySelector("h2")), pair(document.querySelector("header p"))].filter(Boolean);
  });
  return samples.map((sample) => ({ ratio: Math.round(contrastRatio(sample.color, sample.bg) * 10) / 10 }));
}

async function reducedMotion(page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  return page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

async function wideLayout(page) {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(`${base}/parent`, { waitUntil: "domcontentloaded", timeout: 45000 });
  const link = page.getByRole("link", { name: "Today" }).first();
  return link.isVisible();
}

async function darkTheme(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/parent`, { waitUntil: "domcontentloaded", timeout: 45000 });
  const toggle = page.getByRole("button", { name: /Switch to (dark|light)/ });
  if ((await toggle.getAttribute("aria-label")) === "Switch to dark") await toggle.click();
  await page.locator("html.dark").waitFor({ timeout: 5000 });
  const samples = await contrast(page);
  return samples.every((sample) => sample.ratio >= 4.5);
}

async function phoneProfile(cookies) {
  const out = join(tmpdir(), "p10-lighthouse.json");
  const configPath = join(tmpdir(), "p10-lighthouse-config.cjs");
  const header = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  writeFileSync(
    configPath,
    `module.exports = { extends: "lighthouse:default", settings: { onlyCategories: ["performance", "accessibility"], formFactor: "mobile", screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }, extraHeaders: { Cookie: ${JSON.stringify(header)} } } };\n`,
  );
  const args = [
    "--yes",
    "lighthouse@12.8.2",
    `${base}/parent`,
    "--quiet",
    `--config-path=${configPath}`,
    "--chrome-flags=--headless=new",
    "--output=json",
    `--output-path=${out}`,
  ];
  const child = spawn("npx", args, {
    shell: true,
    windowsHide: true,
    env: { ...process.env, CHROME_PATH: chromium.executablePath() },
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });
  const code = await new Promise((resolve) => child.on("close", resolve));
  try {
    unlinkSync(configPath);
  } catch {
    // The config is already gone.
  }
  if (code !== 0) return { failed: scrub(stderr) };
  const json = JSON.parse(readFileSync(out, "utf8"));
  unlinkSync(out);
  return {
    finalUrl: json.finalDisplayedUrl || json.finalUrl,
    performance: Math.round((json.categories?.performance?.score ?? 0) * 100),
    accessibility: Math.round((json.categories?.accessibility?.score ?? 0) * 100),
  };
}

function rememberUser(cookies) {
  const id = userIdFromCookies(cookies);
  if (id) orphanIds.add(id);
}

function userIdFromCookies(cookies) {
  const auth = cookies.filter((cookie) => cookie.name.includes("auth-token")).sort((a, b) => a.name.localeCompare(b.name));
  if (auth.length === 0) return null;
  let raw = auth.map((cookie) => cookie.value).join("");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // The cookie is already decoded.
  }
  const encoded = raw.startsWith("base64-") ? raw.slice("base64-".length) : raw;
  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return session.user?.id ?? null;
  } catch {
    return null;
  }
}

async function removeAudit() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return { families: 0, users: 0 };
  const { createClient } = createRequire(join(root, "package.json"))("@supabase/supabase-js");
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: families, error } = await admin.from("families").select("id").eq("name", familyName);
  if (error) throw error;
  let users = 0;
  for (const family of families ?? []) {
    const { data: members } = await admin.from("members").select("user_id").eq("family_id", family.id);
    const { error: removeFamily } = await admin.from("families").delete().eq("id", family.id);
    if (removeFamily) throw removeFamily;
    for (const member of members ?? []) orphanIds.add(member.user_id);
  }
  for (const id of orphanIds) {
    const { error: removeUser } = await admin.auth.admin.deleteUser(id);
    if (!removeUser) users += 1;
  }
  return { families: families?.length ?? 0, users };
}

function contrastRatio(color, background) {
  const light = Math.max(luminance(color), luminance(background));
  const dark = Math.min(luminance(color), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function luminance(color) {
  const parts = color.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
  const channels = parts.map((value) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function scrub(text) {
  return text.replace(/sb-[^\s;]+/g, "sb-redacted").replace(/base64-[A-Za-z0-9_-]+/g, "base64-redacted").slice(-400);
}

function loadEnv(file) {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index);
    if (!process.env[key]) process.env[key] = line.slice(index + 1);
  }
}
