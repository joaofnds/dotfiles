import { PLAN_RATES, itemPrice, planRate } from "./pricing.js";

export function receiptHeader(order) {
  const lines = [];
  lines.push(`Order ${order.id}`);
  lines.push(`Placed ${order.placedAt.toISOString().slice(0, 10)}`);
  lines.push(`Customer ${order.customer.name}`);
  lines.push("----------------------------------------");
  return lines.join("\n");
}

export function packingSlipHeader(order) {
  const lines = [];
  lines.push(`Order ${order.id}`);
  lines.push(`Placed ${order.placedAt.toISOString().slice(0, 10)}`);
  lines.push(`Customer ${order.customer.name}`);
  lines.push("----------------------------------------");
  lines.push("PACKING SLIP - DO NOT DISCARD");
  return lines.join("\n");
}

export function bulkDiscount(item) {
  if (item.quantity >= 100) return itemPrice(item) * 0.2;
  if (item.quantity >= 10) return itemPrice(item) * 0.1;
  return 0;
}

export function isPremiumPlan(planName) {
  return PLAN_RATES[planName] > PLAN_RATES.basic;
}

export function loyaltyBadge(order) {
  return `${order.customer.account.plan.name.toUpperCase()} member`;
}

export function orderTotal(order) {
  let amount = order.items.reduce(
    (sum, item) => sum + itemPrice(item) - bulkDiscount(item),
    0,
  );
  amount *= 1 - planRate(order.customer.account.plan.name);
  const goods = amount;
  amount = goods > 100 ? 0 : 8.5;
  return goods + amount;
}

export function itemCount(order) {
  return order.items.reduce((count, item) => count + item.quantity, 0);
}

export function totalWeight(order) {
  return order.items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
}

export function hasBackorderedItem(order) {
  return order.items.some((item) => item.backordered);
}
