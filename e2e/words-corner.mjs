import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto("http://localhost:3000/join", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.getByRole("button", { name: "Create family" }).waitFor({ timeout: 20000 });
await page.locator("#familyName").fill("K3 audit");
await page.locator("#childName").fill("Yana");
await page.locator("#pin").fill("2468");
await page.getByRole("button", { name: "Create family" }).click();
await page.waitForURL("**/kid/**", { timeout: 45000 });

async function fit(path) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByRole("img", { name: "Mochi le chat" }).waitFor({ timeout: 20000 });
  const primary = await page.locator("[data-primary]").count();
  const back = await page.getByRole("link", { name: "Retour" }).getAttribute("href");
  const scroll = await page.evaluate(() => document.documentElement.scrollHeight);
  return { primary, back, scroll, mochi: true };
}

const words = await fit("/kid/words");
const corner = await fit("/kid/corner");
const garden = await fit("/kid/garden");
await page.goto("http://localhost:3000/kid/games/bay/safari", { waitUntil: "domcontentloaded", timeout: 45000 });
const animals = await page.getByRole("link", { name: "Retour" }).getAttribute("href");
await page.goto("http://localhost:3000/kid/games/friends", { waitUntil: "domcontentloaded", timeout: 45000 });
const friends = await page.getByRole("link", { name: "Retour" }).getAttribute("href");
await page.goto("http://localhost:3000/kid/store", { waitUntil: "domcontentloaded", timeout: 45000 });
const store = await page.getByRole("link", { name: "Retour" }).getAttribute("href");
await page.goto("http://localhost:3000/kid/games", { waitUntil: "domcontentloaded", timeout: 45000 });
const gameLinks = await page.locator("a[href^='/kid/games/']").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));

const report = { words, corner, garden, animals, friends, store, gameLinks, errors: errors.map((item) => item.slice(0, 180)) };
console.log(JSON.stringify(report));
const ok =
  words.primary === 3 &&
  words.back === "/kid/home" &&
  words.scroll <= 844 &&
  corner.primary === 3 &&
  corner.back === "/kid/home" &&
  corner.scroll <= 844 &&
  garden.back === "/kid/corner" &&
  garden.primary === 0 &&
  animals === "/kid/words" &&
  friends === "/kid/corner" &&
  store === "/kid/corner" &&
  gameLinks.length === 3;
if (!ok) process.exitCode = 1;
await browser.close();
