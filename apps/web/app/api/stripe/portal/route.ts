import { requireUser } from "@/lib/auth/require-user";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRows[0];
    if (!user?.stripe_customer_id) {
      return Response.json({ error: "No Stripe customer" }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.AUTH_URL}/billing`
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: "Unable to create portal session" }, { status: 400 });
  }
}
