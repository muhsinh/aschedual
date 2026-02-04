import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/db";
import { notionConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto/encryption";

export async function GET(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return Response.json({ error: "Missing code" }, { status: 400 });
    }

    const auth = Buffer.from(
      `${process.env.NOTION_OAUTH_CLIENT_ID}:${process.env.NOTION_OAUTH_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.AUTH_URL}/api/notion/callback`
      })
    });

    if (!res.ok) {
      return Response.json({ error: "Notion token exchange failed" }, { status: 400 });
    }

    const data = (await res.json()) as {
      access_token: string;
      workspace_id: string;
      bot_id?: string;
    };

    await db
      .delete(notionConnections)
      .where(eq(notionConnections.user_id, userId));

    await db.insert(notionConnections).values({
      user_id: userId,
      workspace_id: data.workspace_id,
      access_token_enc: encrypt(data.access_token),
      bot_id: data.bot_id ?? null
    });

    return Response.redirect(`${process.env.AUTH_URL}/settings/notion`);
  } catch {
    return Response.json({ error: "Notion callback failed" }, { status: 400 });
  }
}
