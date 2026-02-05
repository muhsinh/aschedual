import { and, eq } from "drizzle-orm";
import { approveRequestSchema } from "@aschedual/shared";
import { db } from "@/db";
import { approvals, captures, proposals } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createGoogleCalendarEvent } from "@/lib/integrations/google";
import { writeNotionApproval } from "@/lib/integrations/notion";
import { getOrCreateUserSettings } from "@/lib/settings/user-settings";
import { errorResponse, okResponse } from "@/lib/http/response";
import { extensionCorsPreflight, withExtensionCors } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return extensionCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);
    const payload = approveRequestSchema.parse(await request.json());

    const proposalRows = await db
      .select({
        proposal: proposals,
        capture: captures
      })
      .from(proposals)
      .innerJoin(captures, eq(captures.id, proposals.captureId))
      .where(and(eq(proposals.id, payload.proposalId), eq(proposals.userId, userId)))
      .limit(1);

    const row = proposalRows[0];
    if (!row) {
      return withExtensionCors(request, errorResponse("Proposal not found", 404));
    }

    const settings = await getOrCreateUserSettings(userId);

    const finalTitle = payload.title ?? row.proposal.parsedTitle;
    const finalStartAt = payload.startAt ?? row.proposal.startAt.toISOString();
    const finalEndAt = payload.endAt ?? row.proposal.endAt.toISOString();
    const finalLocation =
      payload.location === undefined ? row.proposal.locationNullable : payload.location;
    const finalNotes =
      payload.notes === undefined ? row.proposal.notesNullable : payload.notes;

    if (new Date(finalEndAt).getTime() <= new Date(finalStartAt).getTime()) {
      return withExtensionCors(
        request,
        errorResponse("End time must be after start time", 400)
      );
    }

    const calendarId = payload.calendarId ?? settings.defaultCalendarId ?? "primary";

    let googleResult: Awaited<ReturnType<typeof createGoogleCalendarEvent>>;
    try {
      googleResult = await createGoogleCalendarEvent({
        userId,
        calendarId,
        title: finalTitle,
        startAt: finalStartAt,
        endAt: finalEndAt,
        timezone: row.proposal.timezone,
        location: finalLocation,
        description: [row.capture.url, finalNotes ?? ""].filter(Boolean).join("\n\n")
      });
    } catch (error) {
      await db
        .update(proposals)
        .set({
          status: "failed",
          failureReason:
            error instanceof Error
              ? error.message.slice(0, 2000)
              : "Google Calendar write failed"
        })
        .where(eq(proposals.id, row.proposal.id));

      return withExtensionCors(
        request,
        errorResponse("Google Calendar write failed", 502)
      );
    }

    let notionStatus: "skipped" | "success" | "failed" = "skipped";
    let notionPageId: string | null = null;
    let notionError: string | null = null;
    let notionRaw: unknown = null;

    if (payload.sendToNotion) {
      if (!settings.notionTargetType || !settings.notionTargetId) {
        notionStatus = "failed";
        notionError = "Notion target is not configured in destinations settings.";
      } else {
        try {
          const notionResult = await writeNotionApproval({
            userId,
            targetType: settings.notionTargetType,
            targetId: settings.notionTargetId,
            title: finalTitle,
            url: row.capture.url,
            notes: finalNotes
          });

          notionStatus = "success";
          notionPageId = notionResult.pageId;
          notionRaw = notionResult.raw;
        } catch (error) {
          notionStatus = "failed";
          notionError =
            error instanceof Error ? error.message.slice(0, 2000) : "Notion write failed";
        }
      }
    }

    const [approval] = await db.transaction(async (tx) => {
      await tx
        .update(proposals)
        .set({
          parsedTitle: finalTitle,
          startAt: new Date(finalStartAt),
          endAt: new Date(finalEndAt),
          locationNullable: finalLocation,
          notesNullable: finalNotes,
          status: "approved",
          failureReason: null
        })
        .where(eq(proposals.id, row.proposal.id));

      return tx
        .insert(approvals)
        .values({
          proposalId: row.proposal.id,
          userId,
          gcalEventIdNullable: googleResult.id,
          notionPageIdNullable: notionPageId,
          notionStatus,
          notionError,
          rawResponseJson: {
            google: googleResult.raw,
            notion: notionRaw,
            calendarId
          }
        })
        .returning();
    });

    return withExtensionCors(
      request,
      okResponse({
        approval: {
          id: approval.id,
          proposalId: approval.proposalId,
          gcalEventId: approval.gcalEventIdNullable,
          notionPageId: approval.notionPageIdNullable,
          notionStatus: approval.notionStatus,
          notionError: approval.notionError,
          approvedAt: approval.approvedAt.toISOString()
        }
      })
    );
  } catch (error) {
    return withExtensionCors(
      request,
      errorResponse(error instanceof Error ? error.message : "Unable to approve", 400)
    );
  }
}
