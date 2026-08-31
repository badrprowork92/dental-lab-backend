function numberOf(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function money(value: number | string | null | undefined) {
  return numberOf(value).toFixed(2);
}

export function calculateOrderTotal(teethCount: number | string, unitPrice: number | string) {
  return money(numberOf(teethCount) * numberOf(unitPrice));
}

export const URGENT_ORDER_SURCHARGE = 3000;

export function calculateUnitPrice(basePrice: number | string, orderType: "normal" | "urgent" | "adjustment") {
  return money(numberOf(basePrice) + (orderType === "urgent" ? URGENT_ORDER_SURCHARGE : 0));
}

export function countToothLocations(...locations: Array<string | null | undefined>) {
  return locations.reduce((total, location) => total + (location?.match(/\d/g)?.length ?? 0), 0);
}

export function calculateClientBalance(orderTotal: number | string, paidAmount: number | string, discountAmount: number | string) {
  return money(numberOf(orderTotal) - numberOf(paidAmount) - numberOf(discountAmount));
}

export function calculateTechnicianBalance(earnedCommission: number | string, paidOut: number | string) {
  return money(numberOf(earnedCommission) - numberOf(paidOut));
}

export function calculateCashflow(received: number | string, paid: number | string, incomingTransfers: number | string, outgoingTransfers: number | string) {
  return money(numberOf(received) - numberOf(paid) + numberOf(incomingTransfers) - numberOf(outgoingTransfers));
}

export function calculateCommission(input: {
  assignedTeeth: number | string;
  unitPrice: number | string;
  commissionType: "fixed_per_tooth" | "percentage";
  commissionRate: number | string;
  customRate?: number | string | null;
}) {
  const teeth = numberOf(input.assignedTeeth);
  const rate = numberOf(input.customRate ?? input.commissionRate);
  const commission = input.customRate !== undefined && input.customRate !== null
    ? teeth * rate
    : input.commissionType === "fixed_per_tooth"
      ? teeth * rate
      : teeth * numberOf(input.unitPrice) * (rate / 100);
  return money(commission);
}
