import Stripe from 'stripe';

// Lazy initialization - only create Stripe instance when actually used
// This allows build to succeed without STRIPE_SECRET_KEY
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in the environment variables.');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover', // Latest Stripe API version
      typescript: true,
    });
  }
  return stripeInstance;
}

// Legacy export for backwards compatibility (will throw at runtime if not configured)
export const stripe = {
  get checkout() {
    return getStripe().checkout;
  },
} as unknown as Stripe;
