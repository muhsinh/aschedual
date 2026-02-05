import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { captures, proposals } from "@/db/schema";
import { generateProposalFromCapture } from "@/lib/ai";
import { getOrCreateUserSettings } from "@/lib/settings/user-settings";
import type { CapturePayload } from "@aschedual/shared";

export async function createCapture(args: {
  userId: string;
  payload: CapturePayload;
}) {
  const inserted = await db
    .insert(captures)
    .values({
      userId: args.userId,
      url: args.payload.url,
      title: args.payload.title,
      selectedText: args.payload.selectedText,
      snippetNullable: args.payload.snippet ?? null
    })
    .returning();

  const row = inserted[0];
  if (!row) {
    throw new Error("Failed to persist capture");
  }

  return row;
}

export async function createProposalFromCapture(args: {
  userId: string;
  captureId: string;
}) {
  const captureRows = await db
    .select()
    .from(captures)
    .where(and(eq(captures.id, args.captureId), eq(captures.userId, args.userId)))
    .limit(1);

  const capture = captureRows[0];
  if (!capture) {
    throw new Error("Capture not found");
  }

  const settings = await getOrCreateUserSettings(args.userId);

  const parsed = await generateProposalFromCapture({
    title: capture.title,
    url: capture.url,
    selectedText: capture.selectedText,
    snippet: capture.snippetNullable,
    timezone: settings.timezone,
    durationMinutes: settings.defaultDurationMinutes
  });

  const inserted = await db
    .insert(proposals)
    .values({
      captureId: capture.id,
      userId: args.userId,
      parsedTitle: parsed.parsedTitle,
      startAt: new Date(parsed.startAt),
      endAt: new Date(parsed.endAt),
      locationNullable: parsed.location ?? null,
      notesNullable: parsed.notes ?? null,
      status: "proposed",
      timezone: parsed.timezone
    })
    .returning();

  const proposal = inserted[0];
  if (!proposal) {
    throw new Error("Failed to persist proposal");
  }

  return { capture, proposal };
}
