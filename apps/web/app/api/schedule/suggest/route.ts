import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/db";
import { calendars } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getFreeBusy } from "@/lib/google/calendar";
import { proposeSchedule } from "@aschedual/scheduler";
import type { ParsedItem, SchedulingPreferences } from "@aschedual/shared";

function defaultPreferences(timezone: string): SchedulingPreferences {
  return {
    timezone,
    working_hours: {
      mon: { start: "09:00", end: "17:00" },
      tue: { start: "09:00", end: "17:00" },
      wed: { start: "09:00", end: "17:00" },
      thu: { start: "09:00", end: "17:00" },
      fri: { start: "09:00", end: "17:00" }
    },
    default_block_minutes: 60,
    max_blocks_per_day: 2,
    buffer_days: 2,
    no_schedule_after: "19:00"
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = (await req.json()) as {
      parsed: ParsedItem;
      calendar_id: string;
      overrides?: {
        effort_minutes?: number;
        block_minutes?: number;
        deadline_event_enabled?: boolean;
      };
    };

    const calendar = await db
      .select()
      .from(calendars)
      .where(eq(calendars.id, body.calendar_id))
      .limit(1);
    const calendarRow = calendar[0];
    if (!calendarRow) {
      return Response.json({ error: "Calendar not found" }, { status: 404 });
    }

    const tz = calendarRow.time_zone ?? "UTC";
    const now = new Date().toISOString();
    const timeMax =
      body.parsed.deadline ??
      new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

    const busy = await getFreeBusy({
      userId,
      calendarId: calendarRow.calendar_id,
      timeMin: now,
      timeMax
    });

    const parsed = {
      ...body.parsed,
      suggested_effort_minutes:
        body.overrides?.effort_minutes ?? body.parsed.suggested_effort_minutes,
      suggested_block_minutes:
        body.overrides?.block_minutes ?? body.parsed.suggested_block_minutes
    };

    const deadlineEventEnabled =
      body.overrides?.deadline_event_enabled ??
      (parsed.type === "opportunity");

    const plan = proposeSchedule({
      now,
      preferences: defaultPreferences(tz),
      item: parsed,
      busy,
      calendarTimeZone: tz,
      deadlineEventEnabled
    });

    return Response.json(plan);
  } catch (err) {
    return Response.json({ error: "Unable to suggest schedule" }, { status: 400 });
  }
}
