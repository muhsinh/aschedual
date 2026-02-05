import { cookies } from "next/headers";
import { requireSessionUser } from "@/lib/auth/require-user";
import { exchangeNotionCode } from "@/lib/integrations/notion";
import { upsertIntegration } from "@/lib/integrations/store";

const COOKIE_NAME = "notion_oauth_state";

export async function GET(request: Request) {
  const origin = process.env.AUTH_URL ?? new URL(request.url).origin;
  const redirectToSettings = new URL("/settings/integrations", origin);

  try {
    const { userId } = await requireSessionUser();

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = cookies().get(COOKIE_NAME)?.value;
    cookies().delete(COOKIE_NAME);

    if (!code || !state || !cookieState || state !== cookieState) {
      redirectToSettings.searchParams.set("error", "notion_state_mismatch");
      return Response.redirect(redirectToSettings);
    }

    const redirectUri = `${origin}/api/integrations/notion/callback`;
    const token = await exchangeNotionCode({ code, redirectUri });

    await upsertIntegration({
      userId,
      provider: "notion",
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenType: token.token_type ?? null,
      scopes: [],
      expiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000)
        : null
    });

    redirectToSettings.searchParams.set("connected", "notion");
    return Response.redirect(redirectToSettings);
  } catch {
    redirectToSettings.searchParams.set("error", "notion_callback_failed");
    return Response.redirect(redirectToSettings);
  }
}
