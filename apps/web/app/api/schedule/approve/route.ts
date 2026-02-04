import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/db";
import { calendars, calendarEvents, items } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ParsedItem, ProposedPlan } from "@aschedual/shared";
import { createEvent } from "@/lib/google/calendar";
import { assertWithinUsageLimit, incrementUsage } from "@/lib/usage";
import { getNotionClientForUser } from "@/lib/notion/client";

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = (await req.json()) as {
      parsed: ParsedItem;
      plan: ProposedPlan;
      calendar_id: string;
      notion_database_id?: string | null;
      save_only?: boolean;
    };

    await assertWithinUsageLimit(userId);

    const calendar = await db
      .select()
      .from(calendars)
      .where(eq(calendars.id, body.calendar_id))
      .limit(1);
    const calendarRow = calendar[0];
    if (!calendarRow) {
      return Response.json({ error: "Calendar not found" }, { status: 404 });
    }

    const itemResult = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(items)
        .values({
          user_id: userId,
          type: body.parsed.type,
          title: body.parsed.title,
          url: body.parsed.url,
          deadline_at: body.parsed.deadline
            ? new Date(body.parsed.deadline)
            : null,
          deadline_tz: body.parsed.deadline_tz,
          deadline_raw: body.parsed.deadline_raw,
          requirements_json: body.parsed.requirements,
          deliverables_json: body.parsed.deliverables,
          effort_minutes: body.plan.total_effort_minutes,
          block_minutes: body.plan.block_minutes,
          summary: body.parsed.summary,
          notes_json: body.parsed.notes
        })
        .returning({ id: items.id });

      await incrementUsage(userId, tx);

      return inserted[0];
    });

    const calendarLinks: string[] = [];

    if (!body.save_only) {
      for (const block of body.plan.blocks) {
        const event = await createEvent({
          userId,
          calendarId: calendarRow.calendar_id,
          summary: block.label,
          start: block.start,
          end: block.end
        });
        if (event.id) {
          await db.insert(calendarEvents).values({
            user_id: userId,
            item_id: itemResult.id,
            calendar_id: calendarRow.id,
            google_event_id: event.id,
            kind: "workblock",
            start_at: new Date(block.start),
            end_at: new Date(block.end)
          });
        }
        if (event.htmlLink) calendarLinks.push(event.htmlLink);
      }

      if (body.plan.deadline_event_enabled && body.parsed.deadline) {
        const deadlineStart = new Date(body.parsed.deadline).toISOString();
        const deadlineEnd = new Date(
          new Date(body.parsed.deadline).getTime() + 30 * 60 * 1000
        ).toISOString();
        const event = await createEvent({
          userId,
          calendarId: calendarRow.calendar_id,
          summary: `Deadline: ${body.parsed.title}`,
          start: deadlineStart,
          end: deadlineEnd
        });
        if (event.id) {
          await db.insert(calendarEvents).values({
            user_id: userId,
            item_id: itemResult.id,
            calendar_id: calendarRow.id,
            google_event_id: event.id,
            kind: "deadline",
            start_at: new Date(deadlineStart),
            end_at: new Date(deadlineEnd)
          });
        }
        if (event.htmlLink) calendarLinks.push(event.htmlLink);
      }
    }

    let notionUrl: string | undefined;
    if (body.notion_database_id) {
      try {
        const notion = await getNotionClientForUser(userId);
        const database = await notion.databases.retrieve({
          database_id: body.notion_database_id
        });
        const titleProperty =
          Object.entries(database.properties).find(
            ([, value]) => value.type === "title"
          )?.[0] ?? "Name";
        const urlProperty =
          Object.entries(database.properties).find(
            ([, value]) => value.type === "url"
          )?.[0] ?? null;

        const properties: Record<string, any> = {
          [titleProperty]: {
            title: [{ text: { content: body.parsed.title } }]
          }
        };
        if (urlProperty) {
          properties[urlProperty] = { url: body.parsed.url };
        }

        const page = await notion.pages.create({
          parent: { database_id: body.notion_database_id },
          properties,
          children: [
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [
                  { type: "text", text: { content: `URL: ${body.parsed.url}` } }
                ]
              }
            },
            {
              object: "block",
              type: "paragraph",
              paragraph: {
                rich_text: [
                  { type: "text", text: { content: body.parsed.summary } }
                ]
              }
            }
          ]
        });
        notionUrl = page.url ?? undefined;
      } catch {
        // ignore Notion failures for MVP
      }
    }

    return Response.json({
      item_id: itemResult.id,
      calendar_event_links: calendarLinks,
      notion_page_url: notionUrl
    });
  } catch (err) {
    return Response.json({ error: "Unable to approve schedule" }, { status: 400 });
  }
}
