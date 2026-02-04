import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { db } from "@/db";
import { entitlements, googleConnections, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto/encryption";
import { ENTITLEMENT_PLANS } from "@aschedual/shared";
import { syncCalendarsForUser } from "@/lib/google/calendar";

const googleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly"
];

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: googleScopes.join(" ")
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider !== "google") return false;
      const googleSub = account.providerAccountId;
      const email = profile?.email ?? "";
      const name = profile?.name ?? "";
      const avatar = profile?.picture ?? "";

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.google_sub, googleSub))
        .limit(1);

      let userId = existing[0]?.id;
      if (!userId) {
        const inserted = await db
          .insert(users)
          .values({
            google_sub: googleSub,
            email,
            name,
            avatar_url: avatar
          })
          .returning({ id: users.id });
        userId = inserted[0]?.id;
      }

      if (!userId) return false;

      if (account.refresh_token) {
        await db
          .delete(googleConnections)
          .where(eq(googleConnections.user_id, userId));

        await db.insert(googleConnections).values({
          user_id: userId,
          refresh_token_enc: encrypt(account.refresh_token),
          access_token_enc: account.access_token
            ? encrypt(account.access_token)
            : null,
          expiry: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
          scopes: account.scope ?? ""
        });
      }

      await db
        .insert(entitlements)
        .values({
          user_id: userId,
          plan: "FREE",
          max_calendars: ENTITLEMENT_PLANS.FREE.max_calendars,
          max_notion_workspaces: ENTITLEMENT_PLANS.FREE.max_notion_workspaces,
          max_notion_dbs: ENTITLEMENT_PLANS.FREE.max_notion_dbs,
          saves_per_month: ENTITLEMENT_PLANS.FREE.saves_per_month,
          features_json: ENTITLEMENT_PLANS.FREE.features
        })
        .onConflictDoNothing();

      try {
        await syncCalendarsForUser(userId);
      } catch {
        // Swallow calendar sync failures on sign-in
      }

      return true;
    },
    async jwt({ token, account }) {
      if (account?.provider === "google") {
        const googleSub = account.providerAccountId;
        const existing = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.google_sub, googleSub))
          .limit(1);
        token.userId = existing[0]?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as { id?: string }).id = token.userId as string;
      }
      return session;
    }
  }
};
