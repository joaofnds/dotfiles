export const PLAN_RATES = { basic: 0, silver: 0.05, gold: 0.1 };

export function planRate(planName) {
  return PLAN_RATES[planName] ?? 0;
}

export function itemPrice(item) {
  return item.unitPrice * item.quantity;
}
