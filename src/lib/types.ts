export type FamilySummary = {
  family_id: string;
  family_name: string;
  invite_code: string;
  timezone: string;
  has_pin: boolean;
  child_id: string | null;
  child_name: string | null;
  child_language: "fr" | "en";
  star_balance: number;
  my_role: "parent" | "guest";
  my_name: string;
};
