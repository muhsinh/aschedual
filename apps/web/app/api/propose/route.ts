import { proposeRequestSchema, proposeResponseSchema } from "@aschedual/shared";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { createProposalFromCapture } from "@/lib/workflow";
import { errorResponse, okResponse } from "@/lib/http/response";
import { extensionCorsPreflight, withExtensionCors } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return extensionCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);
    const limit = await checkRateLimit(`propose:${userId}`, 30, 60);
    if (!limit.allowed) {
      return withExtensionCors(request, errorResponse("Rate limit exceeded", 429));
    }

    const payload = proposeRequestSchema.parse(await request.json());
    const { proposal } = await createProposalFromCapture({
      userId,
      captureId: payload.captureId
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

    return withExtensionCors(request, okResponse(response));
  } catch (error) {
    return withExtensionCors(
      request,
      errorResponse(
        error instanceof Error ? error.message : "Unable to generate proposal",
        400
      )
    );
  }
}
