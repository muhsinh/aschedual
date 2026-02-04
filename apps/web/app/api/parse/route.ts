import { parseCapture } from "@/lib/ai";
import { requireUser } from "@/lib/auth/require-user";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const limit = checkRateLimit(`parse:${userId}`, 30, 60_000);
    if (!limit.allowed) {
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
    const body = await req.json();
    const parsed = await parseCapture(body);
    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: "Unable to parse capture" }, { status: 400 });
  }
}
