export function balanceAfterApproval(balance: number, cost: number) {
  if (!Number.isInteger(balance) || !Number.isInteger(cost) || cost < 1) return null;
  if (balance < cost) return null;
  return balance - cost;
}
