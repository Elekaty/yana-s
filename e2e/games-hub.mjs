import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto("http://localhost:3000/join", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.getByRole("button", { name: "Create family" }).waitFor({ timeout: 20000 });
await page.locator("#familyName").fill("K4 audit");
await page.locator("#childName").fill("Yana");
await page.locator("#pin").fill("3579");
await page.getByRole("button", { name: "Create family" }).click();
await page.waitForURL("**/kid/**", { timeout: 45000 });

async function choices(path) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.locator("[data-primary]").first().waitFor({ timeout: 20000 });
  const labels = await page.locator("[data-primary]").allInnerTexts();
  const scroll = await page.evaluate(() => document.documentElement.scrollHeight);
  return { labels: labels.map((label) => label.replace(/\s+/g, " ").trim()), scroll };
}

const hub = await choices("/kid/games");
const mochi = await page.getByRole("img", { name: "Mochi le chat" }).isVisible();
const bay = await choices("/kid/games/bay");
const back = await page.getByRole("link", { name: "Retour" }).getAttribute("href");
const report = { hub, mochi, bay, back, errors: errors.map((item) => item.slice(0, 180)) };
console.log(JSON.stringify(report));
const oneWord = (label) => label.split(" ").length === 2;
const ok =
  hub.labels.length === 3 &&
  hub.labels.every(oneWord) &&
  hub.scroll <= 844 &&
  mochi &&
  bay.labels.length === 3 &&
  bay.labels.every(oneWord) &&
  bay.scroll <= 844 &&
  back === "/kid/games" &&
  errors.length === 0;
if (!ok) process.exitCode = 1;
await browser.close();
