import { stripe } from "@/lib/stripe/client";
import { db } from "@/db";
import { entitlements, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { entitlementsForPlan, planForPrice } from "@/lib/stripe/plans";

async function upsertEntitlementsByCustomer(
  customerId: string,
  subscriptionId: string | null
) {
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.stripe_customer_id, customerId))
    .limit(1);
  const user = userRows[0];
  if (!user) return;

  let planName = "FREE";
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = sub.items.data[0]?.price?.id;
    planName = planForPrice(priceId);
  }

  const plan = entitlementsForPlan(planName);

  await db
    .insert(entitlements)
    .values({
      user_id: user.id,
      plan: planName,
      max_calendars: plan.max_calendars,
      max_notion_workspaces: plan.max_notion_workspaces,
      max_notion_dbs: plan.max_notion_dbs,
      saves_per_month: plan.saves_per_month,
      features_json: plan.features,
      stripe_subscription_id: subscriptionId
    })
    .onConflictDoUpdate({
      target: entitlements.user_id,
      set: {
        plan: planName,
        max_calendars: plan.max_calendars,
        max_notion_workspaces: plan.max_notion_workspaces,
        max_notion_dbs: plan.max_notion_dbs,
        saves_per_month: plan.saves_per_month,
        features_json: plan.features,
        stripe_subscription_id: subscriptionId
      }
    });
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!sig) return new Response("Missing signature", { status: 400 });
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      customer: string;
      subscription?: string;
      mode?: string;
    };
    if (session.customer) {
      await upsertEntitlementsByCustomer(
        session.customer,
        session.subscription ?? null
      );
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as {
      id: string;
      customer: string;
    };
    await upsertEntitlementsByCustomer(subscription.customer, subscription.id);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as {
      id: string;
      customer: string;
    };
    await upsertEntitlementsByCustomer(subscription.customer, null);
  }

  return new Response("ok", { status: 200 });
}
