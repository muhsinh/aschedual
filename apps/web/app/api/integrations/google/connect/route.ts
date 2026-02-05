import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getGoogleConnectRedirectUrl } from "@/lib/integrations/google";
import { errorResponse, okResponse } from "@/lib/http/response";

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser(request, { sessionOnly: true });

    const origin = process.env.AUTH_URL ?? new URL(request.url).origin;
    const url = getGoogleConnectRedirectUrl(origin);

    return okResponse({ url });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to start Google connect",
      401
    );
  }
}
