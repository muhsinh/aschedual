import { google } from "googleapis";
import { db } from "@/db";
import { calendars, entitlements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getGoogleAuthClientForUser } from "./client";

export async function listCalendarsForUser(userId: string) {
  const auth = await getGoogleAuthClientForUser(userId);
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.calendarList.list();
  return (
    res.data.items?.map((item) => ({
      calendarId: item.id ?? "",
      name: item.summary ?? "",
      primary: item.primary ?? false,
      timeZone: item.timeZone ?? null
    })) ?? []
  );
}

export async function syncCalendarsForUser(userId: string) {
  const plan = await db
    .select()
    .from(entitlements)
    .where(eq(entitlements.user_id, userId))
    .limit(1);
  const maxCalendars = plan[0]?.max_calendars ?? 1;
  const existing = await db
    .select()
    .from(calendars)
    .where(eq(calendars.user_id, userId));
  const existingMap = new Map(existing.map((c) => [c.calendar_id, c]));

  const list = await listCalendarsForUser(userId);
  let insertedCount = existing.length;

  for (const cal of list) {
    if (!cal.calendarId) continue;
    const already = existingMap.get(cal.calendarId);
    if (!already && insertedCount >= maxCalendars) continue;

    await db
      .insert(calendars)
      .values({
        user_id: userId,
        calendar_id: cal.calendarId,
        name: cal.name || "Untitled",
        time_zone: cal.timeZone,
        is_default: cal.primary ?? false
      })
      .onConflictDoUpdate({
        target: [calendars.user_id, calendars.calendar_id],
        set: { name: cal.name || "Untitled", time_zone: cal.timeZone }
      });

    if (!already) insertedCount += 1;
  }

  const defaultCalendar = await db
    .select()
    .from(calendars)
    .where(eq(calendars.user_id, userId));

  if (!defaultCalendar.some((c) => c.is_default)) {
    const primary =
      defaultCalendar.find((c) => c.calendar_id === "primary") ??
      defaultCalendar[0];
    if (primary) {
      await db
        .update(calendars)
        .set({ is_default: true })
        .where(eq(calendars.id, primary.id));
    }
  }
}

export async function getFreeBusy(args: {
  userId: string;
  calendarId: string;
  timeMin: string;
  timeMax: string;
}) {
  const auth = await getGoogleAuthClientForUser(args.userId);
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: args.timeMin,
      timeMax: args.timeMax,
      items: [{ id: args.calendarId }]
    }
  });
  const busy =
    res.data.calendars?.[args.calendarId]?.busy?.map((slot) => ({
      start: slot.start ?? "",
      end: slot.end ?? ""
    })) ?? [];
  return busy;
}

export async function createEvent(args: {
  userId: string;
  calendarId: string;
  summary: string;
  start: string;
  end: string;
}) {
  const auth = await getGoogleAuthClientForUser(args.userId);
  const calendar = google.calendar({ version: "v3", auth });
  const res = await calendar.events.insert({
    calendarId: args.calendarId,
    requestBody: {
      summary: args.summary,
      start: { dateTime: args.start },
      end: { dateTime: args.end }
    }
  });
  return {
    id: res.data.id ?? "",
    htmlLink: res.data.htmlLink ?? ""
  };
}
