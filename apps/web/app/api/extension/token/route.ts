import { requireUser } from "@/lib/auth/require-user";
import { createExtensionToken } from "@/lib/extension/token";

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const token = await createExtensionToken(userId);
    return Response.json({ token });
  } catch {
    return Response.json({ error: "Unable to create token" }, { status: 400 });
  }
}
