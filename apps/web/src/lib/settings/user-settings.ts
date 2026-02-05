import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userSettings } from "@/db/schema";

export async function getOrCreateUserSettings(userId: string, timezoneHint?: string) {
  const existing = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const inserted = await db
    .insert(userSettings)
    .values({
      userId,
      timezone: timezoneHint && timezoneHint.length > 0 ? timezoneHint : "UTC"
    })
    .returning();

  return inserted[0];
}

export async function updateUserSettings(
  userId: string,
  values: Partial<
    Pick<
      typeof userSettings.$inferInsert,
      | "defaultCalendarId"
      | "defaultDurationMinutes"
      | "notionTargetType"
      | "notionTargetId"
      | "defaultSnippetEnabled"
      | "timezone"
    >
  >
) {
  await getOrCreateUserSettings(userId);

  const updated = await db
    .update(userSettings)
    .set({
      ...values,
      updatedAt: new Date()
    })
    .where(eq(userSettings.userId, userId))
    .returning();

  return updated[0];
}
