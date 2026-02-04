import { requireUser } from "@/lib/auth/require-user";
import { stripe } from "@/lib/stripe/client";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await requireUser(req);
    const body = (await req.json()) as { plan: "PRO" | "POWER" };
    const priceId =
      body.plan === "PRO"
        ? process.env.STRIPE_PRICE_ID_PRO
        : process.env.STRIPE_PRICE_ID_POWER;
    if (!priceId) {
      return Response.json({ error: "Price ID not configured" }, { status: 400 });
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRows[0];
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId }
      });
      customerId = customer.id;
      await db
        .update(users)
        .set({ stripe_customer_id: customerId })
        .where(eq(users.id, userId));
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.AUTH_URL}/billing?success=1`,
      cancel_url: `${process.env.AUTH_URL}/billing?canceled=1`
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: "Unable to create checkout" }, { status: 400 });
  }
}
