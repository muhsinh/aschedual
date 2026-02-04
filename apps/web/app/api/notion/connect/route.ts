import { requireUser } from "@/lib/auth/require-user";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  try {
    await requireUser(req);
    const state = randomBytes(16).toString("hex");
    const redirectUri = `${process.env.AUTH_URL}/api/notion/callback`;
    const url = new URL("https://api.notion.com/v1/oauth/authorize");
    url.searchParams.set("client_id", process.env.NOTION_OAUTH_CLIENT_ID ?? "");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("owner", "user");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    return Response.redirect(url.toString());
  } catch {
    return Response.json({ error: "Unable to start Notion OAuth" }, { status: 400 });
  }
}
