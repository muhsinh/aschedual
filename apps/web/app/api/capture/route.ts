import { capturePayloadSchema, captureResponseSchema } from "@aschedual/shared";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { createCapture } from "@/lib/workflow";
import { errorResponse, okResponse } from "@/lib/http/response";
import { extensionCorsPreflight, withExtensionCors } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return extensionCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);
    const limit = await checkRateLimit(`capture:${userId}`, 60, 60);
    if (!limit.allowed) {
      return withExtensionCors(request, errorResponse("Rate limit exceeded", 429));
    }

    const payload = capturePayloadSchema.parse(await request.json());
    const capture = await createCapture({ userId, payload });

    const response = captureResponseSchema.parse({
      capture: {
        id: capture.id,
        userId: capture.userId,
        url: capture.url,
        title: capture.title,
        selectedText: capture.selectedText,
        snippet: capture.snippetNullable,
        createdAt: capture.createdAt.toISOString()
      }
    });

    return withExtensionCors(request, okResponse(response));
  } catch (error) {
    return withExtensionCors(
      request,
      errorResponse(
        error instanceof Error ? error.message : "Unable to create capture",
        400
      )
    );
  }
}
