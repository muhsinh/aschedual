import { google } from "googleapis";
import { db } from "@/db";
import { googleConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto/encryption";

export async function getGoogleAuthClientForUser(userId: string) {
  const rows = await db
    .select()
    .from(googleConnections)
    .where(eq(googleConnections.user_id, userId))
    .limit(1);
  const connection = rows[0];
  if (!connection) {
    throw new Error("Google connection not found");
  }

  const refreshToken = decrypt(connection.refresh_token_enc);
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.AUTH_URL
  );
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}
