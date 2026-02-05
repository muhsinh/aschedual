import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { disconnectNotionIntegration } from "@/lib/integrations/notion";
import { updateUserSettings } from "@/lib/settings/user-settings";
import { errorResponse, okResponse } from "@/lib/http/response";

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request, {
      sessionOnly: true
    });

    await disconnectNotionIntegration(userId);
    await updateUserSettings(userId, {
      notionTargetId: null,
      notionTargetType: null
    });

    return okResponse({ ok: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to disconnect Notion",
      401
    );
  }
}
