import { checkRateLimit } from "@/lib/rate-limit";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createExtensionToken } from "@/lib/extension/tokens";
import { errorResponse, okResponse } from "@/lib/http/response";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request, {
      sessionOnly: true
    });

    const limit = await checkRateLimit(`extension-token:${userId}`, 10, 60);
    if (!limit.allowed) {
      return errorResponse("Rate limit exceeded", 429);
    }

    const token = await createExtensionToken(userId);
    return okResponse({
      token: token.token,
      expiresAt: token.expiresAt.toISOString()
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to issue extension token",
      401
    );
  }
}
