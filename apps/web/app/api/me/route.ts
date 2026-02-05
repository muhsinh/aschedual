import { eq } from "drizzle-orm";
import { meResponseSchema } from "@aschedual/shared";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { listIntegrationStatus } from "@/lib/integrations/store";
import { getOrCreateUserSettings } from "@/lib/settings/user-settings";
import { errorResponse, okResponse } from "@/lib/http/response";
import { extensionCorsPreflight, withExtensionCors } from "@/lib/http/cors";

export function OPTIONS(request: Request) {
  return extensionCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = rows[0];
    if (!user) {
      return withExtensionCors(request, errorResponse("User not found", 404));
    }

    const [integrationStatus, settings] = await Promise.all([
      listIntegrationStatus(userId),
      getOrCreateUserSettings(userId)
    ]);

    const payload = meResponseSchema.parse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      },
      integrations: integrationStatus.map((entry) => ({
        provider: entry.provider,
        connected: entry.connected,
        expiresAt: entry.expiresAt ? entry.expiresAt.toISOString() : null,
        scopes: entry.scopes
      })),
      defaults: {
        defaultCalendarId: settings.defaultCalendarId,
        defaultDurationMinutes: settings.defaultDurationMinutes,
        notionTargetType: settings.notionTargetType,
        notionTargetId: settings.notionTargetId,
        defaultSnippetEnabled: settings.defaultSnippetEnabled,
        timezone: settings.timezone
      }
    });

    return withExtensionCors(request, okResponse(payload));
  } catch (error) {
    return withExtensionCors(
      request,
      errorResponse(error instanceof Error ? error.message : "Unable to load profile", 401)
    );
  }
}
