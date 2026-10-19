import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto("http://localhost:3000/join", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.getByRole("button", { name: "Create family" }).waitFor({ timeout: 20000 });
await page.locator("#familyName").fill("K8 audit");
await page.locator("#childName").fill("Yana");
await page.locator("#pin").fill("4680");
await page.getByRole("button", { name: "Create family" }).click();
await page.waitForURL("**/kid/**", { timeout: 45000 });

const routes = ["/kid/home", "/kid/games", "/kid/words", "/kid/corner", "/kid/garden"];
const small = [];
const unnamed = [];
const scrolls = {};
for (const route of routes) {
  await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByRole("img", { name: "Mochi le chat" }).waitFor({ timeout: 20000 });
  const measured = await page.evaluate((current) => {
    const nodes = [...document.querySelectorAll("a, button")];
    const tight = [];
    const blank = [];
    for (const node of nodes) {
      const box = node.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const name = (node.getAttribute("aria-label") || node.innerText || "").replace(/\s+/g, " ").trim();
      if (box.width < 64 || box.height < 64) tight.push({ route: current, name: name.slice(0, 40), w: Math.round(box.width), h: Math.round(box.height) });
      if (!name) blank.push(current);
    }
    return { tight, blank, scroll: document.documentElement.scrollHeight };
  }, route);
  small.push(...measured.tight);
  unnamed.push(...measured.blank);
  scrolls[route] = measured.scroll;
}

await page.keyboard.press("Tab");
const focused = await page.evaluate(() => document.activeElement?.tagName ?? "");
await page.emulateMedia({ reducedMotion: "reduce" });
const calm = await page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const report = { small, unnamed, scrolls, focused, calm, errors: errors.map((item) => item.slice(0, 160)) };
console.log(JSON.stringify(report));
const tooTall = Object.values(scrolls).some((value) => value > 844);
if (small.length || unnamed.length || tooTall || !calm || errors.length) process.exitCode = 1;
await browser.close();
