"use server";

import { requireUser, getEntitlements } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import { actionErr, actionOk, type ActionResult } from "@/lib/actions/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// createCheckoutSession
// Free users only. Creates a Stripe Checkout Session and returns the URL.
// ---------------------------------------------------------------------------
export async function createCheckoutSession(): Promise<ActionResult<{ url: string }>> {
  const { user } = await requireUser();
  const { isPro } = await getEntitlements();
  if (isPro) return actionErr("You are already on Pro.");

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) return actionErr("Billing is not configured.");

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/app/settings/billing?success=1`,
    cancel_url: `${APP_URL}/pricing`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id },
    },
  });

  if (!session.url) return actionErr("Could not create checkout session.");
  return actionOk({ url: session.url });
}

// ---------------------------------------------------------------------------
// createPortalSession
// Pro users only. Looks up the Stripe customer and opens the portal.
// ---------------------------------------------------------------------------
export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
  const { user } = await requireUser();
  const { isPro } = await getEntitlements();
  if (!isPro) return actionErr("A Pro subscription is required.");

  const admin = createAdminClient();
  // database.types.ts is a stub; cast the query builder to any so we can
  // select from real tables. Types will be accurate once migrations are applied
  // and `pnpm dlx supabase gen types` is re-run.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub, error } = await (admin as any)
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single() as { data: { stripe_customer_id: string | null } | null; error: { message: string } | null };

  if (error || !sub?.stripe_customer_id) {
    return actionErr("No billing record found. Please contact support.");
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${APP_URL}/app/settings/billing`,
  });

  return actionOk({ url: portalSession.url });
}

// ---------------------------------------------------------------------------
// getMyEntitlements
// Returns the user's subscription details from the subscriptions table.
// ---------------------------------------------------------------------------
export type Entitlements = {
  tier: "free" | "pro";
  status: string;
  renewsAt: string | null;
  cancelAtPeriodEnd: boolean;
};

type SubscriptionRow = {
  tier: "free" | "pro";
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function getMyEntitlements(): Promise<Entitlements> {
  const { user } = await requireUser();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("subscriptions")
    .select("tier, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle() as { data: SubscriptionRow | null };

  if (!data) {
    return { tier: "free", status: "active", renewsAt: null, cancelAtPeriodEnd: false };
  }

  return {
    tier: data.tier ?? "free",
    status: data.status ?? "active",
    renewsAt: data.current_period_end ?? null,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
  };
}
