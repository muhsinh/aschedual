import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { buildNotionConnectUrl } from "@/lib/integrations/notion";
import { errorResponse, okResponse } from "@/lib/http/response";

const COOKIE_NAME = "notion_oauth_state";

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser(request, { sessionOnly: true });

    const state = randomBytes(24).toString("hex");
    cookies().set(COOKIE_NAME, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/"
    });

    const origin = process.env.AUTH_URL ?? new URL(request.url).origin;
    const url = buildNotionConnectUrl(origin, state);

    return okResponse({ url });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to start Notion connect",
      401
    );
  }
}
