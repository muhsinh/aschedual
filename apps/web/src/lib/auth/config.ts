import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { upsertIntegration, upsertUser } from "@/lib/integrations/store";

export const googleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly"
];

function parseScopes(scope: string | null | undefined) {
  if (!scope) return [];
  return scope
    .split(" ")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
          scope: googleScopes.join(" ")
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      const userId = await upsertUser({
        email: user.email,
        name: user.name,
        image: user.image
      });

      if (account?.provider === "google" && account.access_token) {
        await upsertIntegration({
          userId,
          provider: "google",
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
          tokenType: account.token_type,
          scopes: parseScopes(account.scope)
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const rows = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        token.userId = rows[0]?.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }

      return session;
    }
  }
};
