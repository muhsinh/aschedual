import { and, eq } from "drizzle-orm";
import { google } from "googleapis";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { getIntegrationByProvider, upsertIntegration } from "./store";

function parseScopes(scope: string | undefined) {
  if (!scope) return [];
  return scope
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getGoogleConnectRedirectUrl(origin: string) {
  const callbackUrl = new URL("/settings/integrations", origin);
  const signInUrl = new URL("/api/auth/signin/google", origin);
  signInUrl.searchParams.set("callbackUrl", callbackUrl.toString());
  signInUrl.searchParams.set("access_type", "offline");
  signInUrl.searchParams.set("prompt", "consent");
  signInUrl.searchParams.set("include_granted_scopes", "true");
  return signInUrl.toString();
}

async function getGoogleOAuthClient(userId: string) {
  const integration = await getIntegrationByProvider(userId, "google");
  if (!integration) {
    throw new Error("Google integration is not connected");
  }

  const oauth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    `${process.env.AUTH_URL}/api/auth/callback/google`
  );

  oauth.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken ?? undefined,
    expiry_date: integration.expiresAt ? integration.expiresAt.getTime() : undefined
  });

  oauth.on("tokens", async (tokens) => {
    if (!tokens.access_token && !tokens.refresh_token) {
      return;
    }

    await upsertIntegration({
      userId,
      provider: "google",
      accessToken: tokens.access_token ?? integration.accessToken,
      refreshToken: tokens.refresh_token ?? integration.refreshToken,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : integration.expiresAt,
      tokenType: tokens.token_type ?? integration.tokenType,
      scopes: tokens.scope ? parseScopes(tokens.scope) : integration.scopes
    });
  });

  if (integration.expiresAt && integration.expiresAt.getTime() <= Date.now()) {
    await oauth.getAccessToken();
  }

  return oauth;
}

export async function listGoogleCalendars(userId: string) {
  const auth = await getGoogleOAuthClient(userId);
  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.calendarList.list();

  return (
    response.data.items?.map((item) => ({
      id: item.id ?? "primary",
      summary: item.summary ?? "Untitled",
      primary: Boolean(item.primary),
      timezone: item.timeZone ?? "UTC"
    })) ?? []
  );
}

export async function createGoogleCalendarEvent(args: {
  userId: string;
  calendarId: string;
  title: string;
  startAt: string;
  endAt: string;
  timezone: string;
  description?: string | null;
  location?: string | null;
}) {
  const auth = await getGoogleOAuthClient(args.userId);
  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.events.insert({
    calendarId: args.calendarId,
    requestBody: {
      summary: args.title,
      description: args.description ?? undefined,
      location: args.location ?? undefined,
      start: {
        dateTime: args.startAt,
        timeZone: args.timezone
      },
      end: {
        dateTime: args.endAt,
        timeZone: args.timezone
      }
    }
  });

  return {
    id: response.data.id ?? null,
    htmlLink: response.data.htmlLink ?? null,
    raw: response.data
  };
}

export async function disconnectGoogleIntegration(userId: string) {
  await db
    .delete(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, "google")));
}
