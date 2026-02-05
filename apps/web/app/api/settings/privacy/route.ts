import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getOrCreateUserSettings, updateUserSettings } from "@/lib/settings/user-settings";
import { errorResponse, okResponse } from "@/lib/http/response";

const privacySchema = z.object({
  defaultSnippetEnabled: z.boolean(),
  timezone: z.string().min(1).optional()
});

const storedFields = [
  "url",
  "title",
  "selectedText",
  "snippet (only when explicitly included)",
  "proposal title/time edits",
  "approval destination IDs"
];

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);
    const settings = await getOrCreateUserSettings(userId);

    return okResponse({
      defaultSnippetEnabled: settings.defaultSnippetEnabled,
      timezone: settings.timezone,
      storedFields
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to load privacy settings",
      401
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request, {
      sessionOnly: true
    });
    const payload = privacySchema.parse(await request.json());
    const settings = await updateUserSettings(userId, {
      defaultSnippetEnabled: payload.defaultSnippetEnabled,
      timezone: payload.timezone
    });

    return okResponse({
      defaultSnippetEnabled: settings.defaultSnippetEnabled,
      timezone: settings.timezone,
      storedFields
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to update privacy settings",
      400
    );
  }
}
