import type { FamilySummary } from "@/lib/types";

/** Open the app without an account while the screens are still being built. */
export const BUILD_PREVIEW = true;

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
