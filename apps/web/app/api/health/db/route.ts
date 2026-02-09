import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await db.execute(sql`select 1 as ok`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[health][db] failed", error);
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
