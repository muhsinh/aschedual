import { Client } from "@notionhq/client";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrations, notionTargetTypeEnum } from "@/db/schema";
import { getIntegrationByProvider, upsertIntegration } from "./store";

function getNotionBasicAuth() {
  const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
  const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Notion OAuth credentials are not configured");
  }
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export function buildNotionConnectUrl(origin: string, state: string) {
  const redirectUri = `${origin}/api/integrations/notion/callback`;
  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", process.env.NOTION_OAUTH_CLIENT_ID ?? "");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeNotionToken(payload: Record<string, string>) {
  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${getNotionBasicAuth()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion token exchange failed: ${body}`);
  }

  return (await response.json()) as {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    workspace_name?: string;
    workspace_id?: string;
  };
}

export async function exchangeNotionCode(args: {
  code: string;
  redirectUri: string;
}) {
  return exchangeNotionToken({
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.redirectUri
  });
}

async function refreshNotionToken(args: {
  refreshToken: string;
}) {
  return exchangeNotionToken({
    grant_type: "refresh_token",
    refresh_token: args.refreshToken
  });
}

export async function getNotionClientForUser(userId: string) {
  const integration = await getIntegrationByProvider(userId, "notion");
  if (!integration) {
    throw new Error("Notion integration is not connected");
  }

  let accessToken = integration.accessToken;

  if (
    integration.refreshToken &&
    integration.expiresAt &&
    integration.expiresAt.getTime() <= Date.now() + 60_000
  ) {
    const refreshed = await refreshNotionToken({
      refreshToken: integration.refreshToken
    });

    accessToken = refreshed.access_token;

    await upsertIntegration({
      userId,
      provider: "notion",
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? integration.refreshToken,
      tokenType: refreshed.token_type ?? integration.tokenType,
      scopes: integration.scopes,
      expiresAt: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000)
        : null
    });
  }

  return new Client({ auth: accessToken });
}

export async function disconnectNotionIntegration(userId: string) {
  await db
    .delete(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, "notion")));
}

export async function listNotionTargets(userId: string) {
  const notion = await getNotionClientForUser(userId);

  const [databaseSearch, pageSearch] = await Promise.all([
    notion.search({
      filter: {
        value: "database",
        property: "object"
      },
      page_size: 20
    }),
    notion.search({
      filter: {
        value: "page",
        property: "object"
      },
      page_size: 20
    })
  ]);

  const databases = databaseSearch.results.map((result) => {
    const databaseResult = result as any;
    const title =
      result.object === "database"
        ? databaseResult.title
            ?.map((entry: { plain_text: string }) => entry.plain_text)
            .join("")
        : "";
    return {
      id: result.id,
      title: title || "Untitled database",
      type: notionTargetTypeEnum.enumValues[0] as "database"
    };
  });

  const pages = pageSearch.results.map((result) => {
    const title =
      result.object === "page"
        ? (result as any).properties?.title?.title
            ?.map((entry: { plain_text: string }) => entry.plain_text)
            .join("")
        : "";
    return {
      id: result.id,
      title: title || "Untitled page",
      type: notionTargetTypeEnum.enumValues[1] as "page"
    };
  });

  return { databases, pages };
}

export async function writeNotionApproval(args: {
  userId: string;
  targetType: "database" | "page";
  targetId: string;
  title: string;
  url: string;
  notes?: string | null;
}) {
  const notion = await getNotionClientForUser(args.userId);

  if (args.targetType === "database") {
    const database = await notion.databases.retrieve({ database_id: args.targetId });
    const titleProperty =
      Object.entries((database as any).properties).find(
        ([, value]: [string, any]) => value.type === "title"
      )?.[0] ?? "Name";

    const page = await notion.pages.create({
      parent: { database_id: args.targetId },
      properties: {
        [titleProperty]: {
          title: [{ text: { content: args.title } }]
        }
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: args.url } }]
          }
        },
        ...(args.notes
          ? [
              {
                object: "block" as const,
                type: "paragraph" as const,
                paragraph: {
                  rich_text: [{ type: "text" as const, text: { content: args.notes } }]
                }
              }
            ]
          : [])
      ]
    });

    return {
      pageId: page.id,
      url: (page as any).url ?? null,
      raw: page
    };
  }

  const page = await notion.pages.create({
    parent: { page_id: args.targetId },
    properties: {
      title: {
        title: [{ text: { content: args.title } }]
      }
    },
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: args.url } }]
        }
      },
      ...(args.notes
        ? [
            {
              object: "block" as const,
              type: "paragraph" as const,
              paragraph: {
                rich_text: [{ type: "text" as const, text: { content: args.notes } }]
              }
            }
          ]
        : [])
    ]
  });

  return {
    pageId: page.id,
    url: (page as any).url ?? null,
    raw: page
  };
}
