const FREE_SHIPPING_THRESHOLD = 100;
const FLAT_SHIPPING_RATE = 8.5;
const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function lineTotal(item) {
  return item.unitPrice * item.quantity;
}

export function subtotal(items) {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function shippingFee(goodsValue) {
  return goodsValue >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
}

export function grandTotal(items, discountRate) {
  const goods = subtotal(items) * (1 - discountRate);
  return goods + shippingFee(goods);
}

export function checkoutError(items, discountRate) {
  if (items.length === 0) return "cart is empty";
  if (discountRate < 0 || discountRate > 1) return "discount rate must be between 0 and 1";
  if (items.some((item) => item.quantity <= 0)) return "every item needs a positive quantity";
  return null;
}

export function receipt(items, discountRate) {
  const lines = items.map(
    (item) => `${item.name} x${item.quantity} ${CURRENCY.format(lineTotal(item))}`,
  );
  lines.push(`Total ${CURRENCY.format(grandTotal(items, discountRate))}`);
  return lines.join("\n");
}
