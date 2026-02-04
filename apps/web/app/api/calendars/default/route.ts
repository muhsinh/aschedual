import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/db";
import { calendars } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = (await req.json()) as { calendar_db_id: string };
    await db
      .update(calendars)
      .set({ is_default: false })
      .where(eq(calendars.user_id, userId));
    await db
      .update(calendars)
      .set({ is_default: true })
      .where(eq(calendars.id, body.calendar_db_id));
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: "Unable to update default calendar" }, { status: 400 });
  }
}
