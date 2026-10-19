import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.emulateMedia({ reducedMotion: "no-preference" });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto("http://localhost:3000/join", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.getByRole("button", { name: "Create family" }).waitFor({ timeout: 20000 });
await page.locator("#familyName").fill("K7 audit");
await page.locator("#childName").fill("Yana");
await page.locator("#pin").fill("4680");
await page.getByRole("button", { name: "Create family" }).click();
await page.waitForURL("**/kid/**", { timeout: 45000 });
await page.goto("http://localhost:3000/kid/home", { waitUntil: "domcontentloaded", timeout: 45000 });
const cat = page.getByRole("img", { name: "Mochi le chat" });
await cat.waitFor({ timeout: 20000 });
await page.waitForFunction(() => document.querySelector("[data-waving='true']"), null, { timeout: 5000 });
const homeCats = await cat.count();
const homeScroll = await page.evaluate(() => document.documentElement.scrollHeight);
await page.getByRole("button", { name: "Écouter" }).click();
await page.waitForFunction(() => document.querySelector("[data-talking='true']"), null, { timeout: 5000 });
const mouth = await page.evaluate(() => {
  const svg = document.querySelector("[data-talking='true']");
  const nodes = [...document.querySelectorAll("[data-talking='true'] *")];
  return {
    className: svg ? svg.getAttribute("class") : null,
    names: nodes.map((node) => getComputedStyle(node).animationName).filter((name) => name && name !== "none").slice(0, 3),
  };
});

const session = await page.context().newCDPSession(page);
await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const motion = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const start = performance.now();
  function tick(now) {
    frames += 1;
    if (now - start < 1000) requestAnimationFrame(tick);
    else resolve({ frames });
  }
  requestAnimationFrame(tick);
}));
await session.send("Emulation.setCPUThrottlingRate", { rate: 1 });

await page.goto("http://localhost:3000/kid/games", { waitUntil: "domcontentloaded", timeout: 45000 });
await cat.waitFor({ timeout: 20000 });
const gamesScroll = await page.evaluate(() => document.documentElement.scrollHeight);
await page.getByRole("button", { name: "Mochi le chat" }).click();
await page.waitForFunction(() => document.querySelector("[data-action='happy']"), null, { timeout: 3000 });

await page.goto("http://localhost:3000/kid/games/bay/bulles", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForSelector("text=/×/");
const problem = await page.locator("p").filter({ hasText: "×" }).first().innerText();
const parts = problem.split("×").map((item) => Number(item.trim()));
const answer = parts[0] * parts[1];
const choices = page.locator("button").filter({ hasText: /^\d+$/ });
const count = await choices.count();
let wrongText = "";
for (let index = 0; index < count; index += 1) {
  const text = (await choices.nth(index).innerText()).trim();
  if (Number(text) !== answer) {
    wrongText = text;
    break;
  }
}
await choices.filter({ hasText: new RegExp(`^${wrongText}$`) }).first().click();
await page.waitForFunction(() => document.querySelector("[data-tilt='true']"), null, { timeout: 3000 });
const tilted = await page.locator("[data-action='idle'][data-tilt='true']").count();
await choices.filter({ hasText: new RegExp(`^${answer}$`) }).first().click();
await page.waitForFunction(() => document.querySelector("[data-action='cheering']"), null, { timeout: 3000 });

await page.goto("http://localhost:3000/kid/garden", { waitUntil: "domcontentloaded", timeout: 45000 });
await cat.waitFor({ timeout: 20000 });
const bugs = await page.locator("[data-bug]").count();
const sway = await page.locator("[data-sway]").count();
const bugMotion = await page.locator("[data-bug='bee']").evaluate((node) => {
  let drift = false;
  for (const sheet of document.styleSheets) {
    let rules = [];
    try { rules = [...sheet.cssRules]; } catch { continue; }
    if (rules.some((rule) => String(rule.cssText).includes("drift"))) drift = true;
  }
  return { name: getComputedStyle(node).animationName, className: node.className, drift };
});
const reduced = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
await page.emulateMedia({ reducedMotion: "reduce" });
const calmBug = await page.locator("[data-bug='bee']").evaluate((node) => getComputedStyle(node).animationName);
const gardenScroll = await page.evaluate(() => document.documentElement.scrollHeight);
const report = {
  homeCats,
  homeScroll,
  gamesScroll,
  gardenScroll,
  tilted,
  bugs,
  sway,
  bugMotion,
  reduced,
  calmBug,
  mouth,
  frames: motion.frames,
  errors: errors.map((item) => item.slice(0, 180)),
};
console.log(JSON.stringify(report));
if (
  homeCats !== 1
  || homeScroll > 844
  || gamesScroll > 844
  || gardenScroll > 844
  || tilted < 1
  || bugs < 2
  || sway < 12
  || bugMotion.name === "none"
  || calmBug !== "none"
  || mouth.names.length < 1
  || errors.length > 0
) process.exitCode = 1;
await browser.close();
