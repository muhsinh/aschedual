import { clipRequestSchema, proposeResponseSchema } from "@aschedual/shared";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { createCapture, createProposalFromCapture } from "@/lib/workflow";
import { errorResponse, okResponse } from "@/lib/http/response";
import { extensionCorsPreflight, withExtensionCors } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return extensionCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);
    const [captureLimit, proposeLimit] = await Promise.all([
      checkRateLimit(`capture:${userId}`, 60, 60),
      checkRateLimit(`propose:${userId}`, 30, 60)
    ]);

    if (!captureLimit.allowed || !proposeLimit.allowed) {
      return withExtensionCors(request, errorResponse("Rate limit exceeded", 429));
    }

    const payload = clipRequestSchema.parse(await request.json());
    const capture = await createCapture({
      userId,
      payload: payload.capture
    });
    const { proposal } = await createProposalFromCapture({
      userId,
      captureId: capture.id
    });

    const response = proposeResponseSchema.parse({
      proposal: {
        id: proposal.id,
        captureId: proposal.captureId,
        userId: proposal.userId,
        parsedTitle: proposal.parsedTitle,
        startAt: proposal.startAt.toISOString(),
        endAt: proposal.endAt.toISOString(),
        location: proposal.locationNullable,
        notes: proposal.notesNullable,
        status: proposal.status,
        failureReason: proposal.failureReason,
        timezone: proposal.timezone,
        createdAt: proposal.createdAt.toISOString()
      }
    });

    return withExtensionCors(
      request,
      okResponse({
        capture: {
          id: capture.id,
          userId: capture.userId,
          url: capture.url,
          title: capture.title,
          selectedText: capture.selectedText,
          snippet: capture.snippetNullable,
          createdAt: capture.createdAt.toISOString()
        },
        ...response
      })
    );
  } catch (error) {
    return withExtensionCors(
      request,
      errorResponse(error instanceof Error ? error.message : "Unable to clip", 400)
    );
  }
}
