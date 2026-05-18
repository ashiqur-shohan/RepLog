import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis ? Redis.fromEnv() : null;

/** Store a handled Stripe event ID for 24 h to guarantee idempotency. */
async function markHandled(eventId: string): Promise<boolean> {
  if (!redis) return false; // dev without Redis — skip idempotency
  const key = `stripe:event:${eventId}`;
  const result = await redis.set(key, "1", { nx: true, ex: 86400 });
  return result === null; // null → key already existed → already handled
}

// ---------------------------------------------------------------------------
// Helper: extract user_id from a Stripe subscription object
// ---------------------------------------------------------------------------
function userIdFromSub(sub: Stripe.Subscription): string | null {
  return (sub.metadata?.user_id as string | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// Upsert subscription row + mirror tier in auth.users.app_metadata
// ---------------------------------------------------------------------------
async function upsertSubscription(sub: Stripe.Subscription, userId: string) {
  const admin = createAdminClient();
  const tier = sub.status === "active" || sub.status === "trialing" ? "pro" : "free";
  const item = sub.items.data[0];

  const payload = {
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    stripe_price_id: item?.price?.id ?? null,
    tier,
    status: sub.status,
    current_period_start: new Date((sub.current_period_start ?? 0) * 1000).toISOString(),
    current_period_end: new Date((sub.current_period_end ?? 0) * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    amount_cents: item?.price?.unit_amount ?? null,
    currency: item?.price?.currency ?? "usd",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: subError } = await (admin as any)
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" }) as { error: { message: string } | null };

  if (subError) {
    log.error("webhook: subscriptions upsert failed", { error: subError.message, userId });
    throw new Error(subError.message);
  }

  // Mirror tier into auth.users.app_metadata so getEntitlements() is instant
  const { error: userError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { tier },
  });
  if (userError) {
    log.error("webhook: app_metadata update failed", { error: userError.message, userId });
    // Non-fatal — the subscription row is the source of truth for billing page
  }
}

// ---------------------------------------------------------------------------
// Cancel: set status + flip tier to free
// ---------------------------------------------------------------------------
async function cancelSubscription(sub: Stripe.Subscription, userId: string) {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: subError } = await (admin as any)
    .from("subscriptions")
    .update({
      status: "canceled",
      tier: "free",
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: false,
    })
    .eq("user_id", userId) as { error: { message: string } | null };

  if (subError) {
    log.error("webhook: cancel update failed", { error: subError.message, userId });
    throw new Error(subError.message);
  }

  const { error: userError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { tier: "free" },
  });
  if (userError) {
    log.error("webhook: app_metadata cancel update failed", { error: userError.message, userId });
  }
}

// ---------------------------------------------------------------------------
// Write to audit_log — best-effort, never throws
// ---------------------------------------------------------------------------
async function auditLog(
  action: "subscribe" | "cancel",
  userId: string | null,
  metadata: Record<string, unknown>,
) {
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("audit_log")
      .insert({
        user_id: userId ?? null,
        action,
        entity_type: "subscription",
        entity_id: (metadata["subscription_id"] as string | undefined) ?? null,
        metadata,
      });
  } catch (err) {
    log.warn("webhook: audit_log write failed (best-effort)", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error("webhook: STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    log.warn("webhook: signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const alreadyHandled = await markHandled(event.id);
  if (alreadyHandled) {
    log.info("webhook: duplicate event ignored", { eventId: event.id, type: event.type });
    return NextResponse.json({ received: true });
  }

  log.info("webhook: processing event", { eventId: event.id, type: event.type });

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        let userId = userIdFromSub(sub);

        // Fallback: look up via customer metadata if not in subscription metadata
        if (!userId) {
          const stripe = getStripe();
          const customer = await stripe.customers.retrieve(sub.customer as string);
          if (!customer.deleted) {
            userId = (customer.metadata?.user_id as string | undefined) ?? null;
          }
        }

        if (!userId) {
          log.warn("webhook: could not resolve user_id for subscription", {
            subscriptionId: sub.id,
          });
          return NextResponse.json({ received: true });
        }

        await upsertSubscription(sub, userId);
        await auditLog("subscribe", userId, {
          subscription_id: sub.id,
          status: sub.status,
          event_type: event.type,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        let userId = userIdFromSub(sub);

        if (!userId) {
          const stripe = getStripe();
          const customer = await stripe.customers.retrieve(sub.customer as string);
          if (!customer.deleted) {
            userId = (customer.metadata?.user_id as string | undefined) ?? null;
          }
        }

        if (!userId) {
          log.warn("webhook: could not resolve user_id for canceled subscription", {
            subscriptionId: sub.id,
          });
          return NextResponse.json({ received: true });
        }

        await cancelSubscription(sub, userId);
        await auditLog("cancel", userId, {
          subscription_id: sub.id,
          event_type: event.type,
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription?.id ?? null);
        await auditLog("subscribe", null, {
          invoice_id: invoice.id,
          subscription_id: subscriptionId,
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
          event_type: event.type,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : (invoice.subscription?.id ?? null);
        await auditLog("subscribe", null, {
          invoice_id: invoice.id,
          subscription_id: subscriptionId,
          amount_due: invoice.amount_due,
          currency: invoice.currency,
          event_type: event.type,
          failure_reason: invoice.last_finalization_error?.message ?? "unknown",
        });
        log.warn("webhook: invoice payment failed", {
          invoiceId: invoice.id,
          subscriptionId,
        });
        break;
      }

      default:
        log.info("webhook: unhandled event type", { type: event.type });
    }
  } catch (err) {
    log.error("webhook: handler threw", {
      error: err instanceof Error ? err.message : String(err),
      eventId: event.id,
      type: event.type,
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
