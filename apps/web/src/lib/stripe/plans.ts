import { ENTITLEMENT_PLANS, type PlanName } from "@aschedual/shared";

export function planForPrice(priceId: string | null | undefined): PlanName {
  if (!priceId) return "FREE";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_ID_POWER) return "POWER";
  return "FREE";
}

export function entitlementsForPlan(plan: PlanName) {
  return ENTITLEMENT_PLANS[plan];
}
