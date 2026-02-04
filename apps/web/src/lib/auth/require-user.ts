import { auth } from "@/lib/auth";
import { verifyExtensionToken } from "@/lib/extension/token";

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    const userId = await verifyExtensionToken(token);
    if (!userId) throw new Error("Invalid extension token");
    return { userId };
  }

  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return { userId };
}
