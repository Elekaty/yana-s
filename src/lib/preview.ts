import type { FamilySummary } from "@/lib/types";

export const previewFamily: FamilySummary = {
  family_id: "preview",
  family_name: "Yana",
  invite_code: "preview",
  timezone: "Europe/Paris",
  has_pin: false,
  child_id: null,
  child_name: "Yana",
  child_language: "fr",
  star_balance: 12,
  my_role: "parent",
  my_name: "Parent",
};

/** Local viewing only. Never on a Vercel production deployment. */
export function demoMode() {
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
