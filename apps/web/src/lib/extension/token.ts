import { randomBytes, createHash } from "crypto";
import { db } from "@/db";
import { extensionTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createExtensionToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(extensionTokens).values({
    user_id: userId,
    token_hash: hashToken(token)
  });
  return token;
}

export async function verifyExtensionToken(token: string) {
  const tokenHash = hashToken(token);
  const rows = await db
    .select()
    .from(extensionTokens)
    .where(eq(extensionTokens.token_hash, tokenHash))
    .limit(1);
  const record = rows[0];
  if (!record || record.revoked_at) return null;

  await db
    .update(extensionTokens)
    .set({ last_used_at: new Date() })
    .where(eq(extensionTokens.id, record.id));

  return record.user_id;
}
