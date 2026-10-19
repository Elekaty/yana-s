import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { balanceAfterApproval } from "@/lib/rewards";

describe("reward approval", () => {
  it("drops the balance by exactly the cost", () => {
    expect(balanceAfterApproval(12, 5)).toBe(7);
    expect(balanceAfterApproval(5, 5)).toBe(0);
    expect(balanceAfterApproval(4, 5)).toBeNull();
    expect(balanceAfterApproval(5, 0)).toBeNull();
  });

  it("spends stars only inside approve_purchase", () => {
    const sql = readFileSync("supabase/migrations/0001_core.sql", "utf8");
    const fn = sql.slice(sql.indexOf("function approve_purchase"), sql.indexOf("function storage_family"));
    expect(fn).toContain("star_balance = star_balance - cost");
    expect(fn).toContain("star_balance >= cost");
    expect(fn).toContain("not enough stars");
    expect(fn).toContain("-cost, 'purchase'");
    expect(fn).toContain("role is distinct from 'parent'");
  });
});
