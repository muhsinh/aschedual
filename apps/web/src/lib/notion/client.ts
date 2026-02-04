import { Client } from "@notionhq/client";
import { db } from "@/db";
import { notionConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto/encryption";

export async function getNotionClientForUser(userId: string) {
  const rows = await db
    .select()
    .from(notionConnections)
    .where(eq(notionConnections.user_id, userId))
    .limit(1);
  const connection = rows[0];
  if (!connection) {
    throw new Error("Notion connection not found");
  }
  const token = decrypt(connection.access_token_enc);
  return new Client({ auth: token });
}
