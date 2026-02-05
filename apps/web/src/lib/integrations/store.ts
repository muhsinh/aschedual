import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  integrations,
  type IntegrationProvider,
  users,
  userSettings
} from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/crypto/envelope";

export type IntegrationRecord = {
  id: string;
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  tokenType: string | null;
  scopes: string[];
};

export async function getIntegrationByProvider(
  userId: string,
  provider: IntegrationProvider
): Promise<IntegrationRecord | null> {
  const rows = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    provider: row.provider,
    accessToken: decryptSecret(row.encryptedAccessToken),
    refreshToken: row.encryptedRefreshToken
      ? decryptSecret(row.encryptedRefreshToken)
      : null,
    expiresAt: row.expiresAt,
    tokenType: row.tokenType,
    scopes: row.scopes
  };
}

export async function upsertIntegration(args: {
  userId: string;
  provider: IntegrationProvider;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  tokenType?: string | null;
  scopes?: string[];
}) {
  const existing = await db
    .select()
    .from(integrations)
    .where(and(eq(integrations.userId, args.userId), eq(integrations.provider, args.provider)))
    .limit(1);

  const existingRow = existing[0];
  const encryptedRefreshToken =
    args.refreshToken === undefined
      ? (existingRow?.encryptedRefreshToken ?? null)
      : args.refreshToken
        ? encryptSecret(args.refreshToken)
        : null;

  const expiresAt =
    args.expiresAt === undefined ? (existingRow?.expiresAt ?? null) : args.expiresAt;
  const tokenType =
    args.tokenType === undefined ? (existingRow?.tokenType ?? null) : args.tokenType;
  const scopes = args.scopes ?? existingRow?.scopes ?? [];

  await db
    .insert(integrations)
    .values({
      userId: args.userId,
      provider: args.provider,
      encryptedAccessToken: encryptSecret(args.accessToken),
      encryptedRefreshToken,
      expiresAt,
      tokenType,
      scopes,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [integrations.userId, integrations.provider],
      set: {
        encryptedAccessToken: encryptSecret(args.accessToken),
        encryptedRefreshToken,
        expiresAt,
        tokenType,
        scopes,
        updatedAt: new Date()
      }
    });
}

export async function deleteIntegration(userId: string, provider: IntegrationProvider) {
  await db
    .delete(integrations)
    .where(and(eq(integrations.userId, userId), eq(integrations.provider, provider)));
}

export async function listIntegrationStatus(userId: string) {
  const rows = await db
    .select({
      provider: integrations.provider,
      scopes: integrations.scopes,
      expiresAt: integrations.expiresAt
    })
    .from(integrations)
    .where(eq(integrations.userId, userId));

  const map = new Map(rows.map((row) => [row.provider, row]));

  return ["google", "notion"].map((provider) => {
    const row = map.get(provider as IntegrationProvider);
    return {
      provider: provider as IntegrationProvider,
      connected: Boolean(row),
      expiresAt: row?.expiresAt ?? null,
      scopes: row?.scopes ?? []
    };
  });
}

export async function upsertUser(args: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const result = await db
    .insert(users)
    .values({
      email: args.email,
      name: args.name ?? null,
      image: args.image ?? null
    })
    .onConflictDoUpdate({
      target: [users.email],
      set: {
        name: args.name ?? null,
        image: args.image ?? null
      }
    })
    .returning({ id: users.id });

  const userId = result[0]?.id;
  if (!userId) {
    throw new Error("Unable to create or update user");
  }

  await db
    .insert(userSettings)
    .values({ userId })
    .onConflictDoNothing();

  return userId;
}
