export type InboxFilter = "all" | "urgent" | "important" | "fyi" | "mine";

export function parseInboxFilter(value: string | undefined): InboxFilter {
  if (value === "urgent" || value === "important" || value === "fyi" || value === "mine") return value;
  return "all";
}

export function matchesInboxFilter(message: { tier: string | null }, filter: InboxFilter, waitingForMe: boolean) {
  if (filter === "all") return true;
  if (filter === "mine") return waitingForMe;
  return message.tier === filter;
}
