import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { disconnectGoogleIntegration } from "@/lib/integrations/google";
import { errorResponse, okResponse } from "@/lib/http/response";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request, {
      sessionOnly: true
    });
    await disconnectGoogleIntegration(userId);
    return okResponse({ ok: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to disconnect Google",
      401
    );
  }
}
