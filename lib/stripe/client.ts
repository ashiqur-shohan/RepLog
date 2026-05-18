import "server-only";
import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Returns a singleton Stripe SDK instance.
 * Throws at call time (not module load) so the build never fails on missing env.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  _stripe = new Stripe(key, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: "2025-02-24.acacia" as any,
    typescript: true,
  });
  return _stripe;
}
