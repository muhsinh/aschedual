import { db } from "@/db";
import { entitlements, usageMonthly } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export function getCurrentYearMonth(date = new Date()) {
  return date.getUTCFullYear() * 100 + (date.getUTCMonth() + 1);
}

export async function getUserEntitlements(userId: string) {
  const rows = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.user_id, userId))
    .limit(1);
  return rows[0];
}

export async function assertWithinUsageLimit(userId: string) {
  const plan = await getUserEntitlements(userId);
  if (!plan || plan.saves_per_month == null) return true;

  const yyyymm = getCurrentYearMonth();
  const rows = await db
    .select()
    .from(usageMonthly)
    .where(and(eq(usageMonthly.user_id, userId), eq(usageMonthly.yyyymm, yyyymm)))
    .limit(1);
  const count = rows[0]?.saves_count ?? 0;
  if (count >= plan.saves_per_month) {
    throw new Error("Monthly save limit reached");
  }
  return true;
}

export async function incrementUsage(
  userId: string,
  tx = db
): Promise<void> {
  const yyyymm = getCurrentYearMonth();
  await tx
    .insert(usageMonthly)
    .values({ user_id: userId, yyyymm, saves_count: 1 })
    .onConflictDoUpdate({
      target: [usageMonthly.user_id, usageMonthly.yyyymm],
      set: { saves_count: sql`${usageMonthly.saves_count} + 1` }
    });
}
