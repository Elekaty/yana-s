import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { decideGate } from "@/lib/parent-gate";

const PARENT_ROUTES = [
  "/parent",
  "/parent/calendar",
  "/parent/calendar/confirm",
  "/parent/curriculum",
  "/parent/inbox",
  "/parent/progress",
  "/parent/rewards",
  "/parent/scan",
  "/parent/setup",
  "/parent/setup/status",
  "/parent/study",
  "/parent/todo",
  "/parent/unlock",
  "/parent/voice",
];

function pagesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) found.push(...pagesUnder(full));
    else if (entry === "page.tsx") found.push(full);
  }
  return found;
}

function routeFromPage(file: string, appDir: string) {
  const relative = path.relative(appDir, file).replaceAll("\\", "/").replace(/\/page\.tsx$/, "");
  const route = `/${relative.replace(/\/\([^/]+\)/g, "")}`;
  return route === "/" ? "/" : route.replace(/\/$/, "");
}

describe("parent PIN gate", () => {
  const appDir = path.join(process.cwd(), "src", "app");
  const routes = pagesUnder(path.join(appDir, "parent")).map((file) => routeFromPage(file, appDir)).sort();

  it("sends every parent page to sign-in when signed out", () => {
    expect(routes).toEqual(PARENT_ROUTES);
    for (const route of routes) {
      expect(decideGate(route, false, false).redirectTo).toBe("/login");
    }
  });

  it("checks the session inside every parent page", () => {
    const files = pagesUnder(path.join(appDir, "parent"));
    expect(files.length).toBe(PARENT_ROUTES.length);
    for (const file of files) {
      expect(readFileSync(file, "utf8")).toContain("requireParent(");
    }
  });

  it("sends a signed-in parent without the unlock cookie to the PIN page", () => {
    for (const route of routes.filter((route) => route !== "/parent/unlock")) {
      expect(decideGate(route, true, false).redirectTo).toBe("/parent/unlock");
    }
  });

  it("keeps the PIN page itself from opening the parent screens", () => {
    expect(decideGate("/parent/unlock", true, false).redirectTo).toBeUndefined();
    expect(decideGate("/parent/unlock", true, true).redirectTo).toBeUndefined();
  });

  it("lets a valid cookie through and locks the area when kid mode opens", () => {
    expect(decideGate("/parent/inbox", true, true).redirectTo).toBeUndefined();
    expect(decideGate("/kid/home", true, true).clearUnlock).toBe(true);
    expect(decideGate("/parent", false, false).redirectTo).toBe("/login");
  });

  it("denies the scan APIs when signed out and leaves webhook routes alone", () => {
    expect(decideGate("/api/scans", false, false).deny).toBe(true);
    expect(decideGate("/api/scans/abc/retry", false, false).deny).toBe(true);
    expect(decideGate("/api/scans", true, true).deny).toBeUndefined();
    expect(decideGate("/api/jobs/run", false, false).deny).toBeUndefined();
    expect(decideGate("/api/intake/telegram", false, false).redirectTo).toBeUndefined();
    expect(decideGate("/api/calendar/00000000-0000-0000-0000-000000000000", false, false).redirectTo).toBeUndefined();
  });
});
