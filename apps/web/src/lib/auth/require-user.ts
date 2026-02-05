import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { verifyExtensionToken } from "@/lib/extension/tokens";
import { db } from "@/db";
import { users } from "@/db/schema";

export type AuthenticatedUser = {
  userId: string;
  mode: "session" | "bearer";
};

export async function requireSessionUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  const sessionUser = session?.user as
    | { id?: string; email?: string | null }
    | undefined;

  if (sessionUser?.id) {
    return {
      userId: sessionUser.id,
      mode: "session"
    };
  }

  if (sessionUser?.email) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, sessionUser.email))
      .limit(1);

    if (rows[0]?.id) {
      return {
        userId: rows[0].id,
        mode: "session"
      };
    }
  }

  throw new Error("Unauthorized");
}

export async function requireAuthenticatedUser(
  request: Request,
  options?: { sessionOnly?: boolean }
): Promise<AuthenticatedUser> {
  if (!options?.sessionOnly) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length).trim();
      const userId = await verifyExtensionToken(token);
      if (!userId) {
        throw new Error("Invalid extension token");
      }
      return {
        userId,
        mode: "bearer"
      };
    }
  }

  return requireSessionUser();
}
