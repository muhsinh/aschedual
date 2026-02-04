import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/db";
import { calendars, notionDatabases } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const calendarRows = await db
      .select()
      .from(calendars)
      .where(eq(calendars.user_id, userId));
    const notionRows = await db
      .select()
      .from(notionDatabases)
      .where(eq(notionDatabases.user_id, userId));

    return Response.json({
      calendars: calendarRows.map((c) => ({
        id: c.id,
        name: c.name,
        is_default: c.is_default,
        time_zone: c.time_zone,
        calendar_id: c.calendar_id
      })),
      notion_databases: notionRows.map((n) => ({
        id: n.id,
        name: n.name,
        is_default: n.is_default,
        database_id: n.database_id
      }))
    });
  } catch (err) {
    return Response.json({ error: "Unable to load destinations" }, { status: 400 });
  }
}
