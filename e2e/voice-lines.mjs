import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  window.__said = [];
  const speak = (utterance) => window.__said.push(utterance.text);
  const synth = window.speechSynthesis ?? {};
  try {
    synth.speak = speak;
    synth.cancel = () => {};
    synth.getVoices = () => [];
    if (!window.speechSynthesis) window.speechSynthesis = synth;
  } catch {
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { speak, cancel() {}, getVoices() { return []; } },
    });
  }
});
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto("http://localhost:3000/join", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.getByRole("button", { name: "Create family" }).waitFor({ timeout: 20000 });
await page.locator("#familyName").fill("K6 audit");
await page.locator("#childName").fill("Yana");
await page.locator("#pin").fill("5802");
await page.getByRole("button", { name: "Create family" }).click();
await page.waitForURL("**/kid/**", { timeout: 45000 });

const expectLine = {
  "/kid/home": "Bonjour Yana !",
  "/kid/homework": "Fais ton devoir.",
  "/kid/games": "Choisis une île.",
  "/kid/words": "Choisis les mots.",
  "/kid/corner": "Voici ton coin.",
  "/kid/garden": "Touche une plante.",
};
const seen = {};
for (const [path, line] of Object.entries(expectLine)) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByRole("button", { name: "Écouter" }).waitFor({ timeout: 20000 });
  const text = await page.getByText(line, { exact: true }).first().textContent();
  const scroll = await page.evaluate(() => document.documentElement.scrollHeight);
  seen[path] = { text, scroll };
}
await page.goto("http://localhost:3000/kid/games", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.getByRole("button", { name: "Écouter" }).click();
await page.evaluate(() => {
  const el = document.querySelector("a[href='/kid/games/bay']");
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
});
await page.waitForTimeout(700);
const said = await page.evaluate(() => window.__said);
const report = { seen, said, errors: errors.map((item) => item.slice(0, 180)) };
console.log(JSON.stringify(report));
const ok =
  Object.entries(expectLine).every(([path, line]) => seen[path].text === line && seen[path].scroll <= 844) &&
  said.includes("Choisis une île.") &&
  said.includes("Plage") &&
  errors.length === 0;
if (!ok) process.exitCode = 1;
await browser.close();
