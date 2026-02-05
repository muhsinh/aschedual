import { createHash, randomBytes } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { extensionTokens } from "@/db/schema";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export function hashExtensionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createExtensionToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashExtensionToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(extensionTokens).values({
    userId,
    tokenHash,
    expiresAt
  });

  return {
    token,
    expiresAt
  };
}

export async function verifyExtensionToken(token: string) {
  const tokenHash = hashExtensionToken(token);
  const rows = await db
    .select({ userId: extensionTokens.userId })
    .from(extensionTokens)
    .where(
      and(
        eq(extensionTokens.tokenHash, tokenHash),
        gt(extensionTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  return rows[0]?.userId ?? null;
}
