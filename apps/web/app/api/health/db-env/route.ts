export const runtime = "nodejs";

function sanitizeConnectionString(value: string) {
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: url.port,
      database: url.pathname.replace(/^\//, ""),
      user: url.username
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function GET() {
  const raw =
    process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "(missing)";

  if (raw === "(missing)") {
    return Response.json({ ok: false, error: "No DATABASE_URL or POSTGRES_URL" });
  }

  return Response.json({
    ok: true,
    source: process.env.DATABASE_URL ? "DATABASE_URL" : "POSTGRES_URL",
    ...sanitizeConnectionString(raw)
  });
}
