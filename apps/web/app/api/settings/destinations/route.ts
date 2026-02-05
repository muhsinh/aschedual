import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { listGoogleCalendars } from "@/lib/integrations/google";
import { listIntegrationStatus } from "@/lib/integrations/store";
import { listNotionTargets } from "@/lib/integrations/notion";
import { getOrCreateUserSettings, updateUserSettings } from "@/lib/settings/user-settings";
import { errorResponse, okResponse } from "@/lib/http/response";

const destinationsUpdateSchema = z.object({
  defaultCalendarId: z.string().nullable().optional(),
  defaultDurationMinutes: z.number().int().min(15).max(480).optional(),
  notionTargetType: z.enum(["database", "page"]).nullable().optional(),
  notionTargetId: z.string().nullable().optional(),
  timezone: z.string().min(1).optional()
});

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request);
    const [settings, integrations] = await Promise.all([
      getOrCreateUserSettings(userId),
      listIntegrationStatus(userId)
    ]);

    const googleConnected = integrations.find((entry) => entry.provider === "google")
      ?.connected;
    const notionConnected = integrations.find((entry) => entry.provider === "notion")
      ?.connected;

    let calendars: Array<{
      id: string;
      summary: string;
      primary: boolean;
      timezone: string;
    }> = [];

    if (googleConnected) {
      try {
        calendars = await listGoogleCalendars(userId);
      } catch {
        calendars = [];
      }
    }

    let notionTargets: {
      databases: Array<{ id: string; title: string; type: "database" }>;
      pages: Array<{ id: string; title: string; type: "page" }>;
    } = { databases: [], pages: [] };

    if (notionConnected) {
      try {
        notionTargets = await listNotionTargets(userId);
      } catch {
        notionTargets = { databases: [], pages: [] };
      }
    }

    return okResponse({
      settings: {
        defaultCalendarId: settings.defaultCalendarId,
        defaultDurationMinutes: settings.defaultDurationMinutes,
        notionTargetType: settings.notionTargetType,
        notionTargetId: settings.notionTargetId,
        timezone: settings.timezone
      },
      calendars,
      notionTargets
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to load destinations",
      401
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuthenticatedUser(request, {
      sessionOnly: true
    });

    const payload = destinationsUpdateSchema.parse(await request.json());

    const updated = await updateUserSettings(userId, {
      defaultCalendarId:
        payload.defaultCalendarId === undefined
          ? undefined
          : payload.defaultCalendarId,
      defaultDurationMinutes:
        payload.defaultDurationMinutes === undefined
          ? undefined
          : payload.defaultDurationMinutes,
      notionTargetType:
        payload.notionTargetType === undefined
          ? undefined
          : payload.notionTargetType,
      notionTargetId:
        payload.notionTargetId === undefined ? undefined : payload.notionTargetId,
      timezone: payload.timezone === undefined ? undefined : payload.timezone
    });

    return okResponse({
      settings: {
        defaultCalendarId: updated.defaultCalendarId,
        defaultDurationMinutes: updated.defaultDurationMinutes,
        notionTargetType: updated.notionTargetType,
        notionTargetId: updated.notionTargetId,
        timezone: updated.timezone
      }
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to update destinations",
      400
    );
  }
}
