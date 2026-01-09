/**
 * Stripe Checkout Session API
 *
 * SECURITY (Jan 2026 - Fixed by สมคิด + สมหมาย audit):
 * - Session verification with HMAC-SHA256 signature
 * - Rejects unsigned/tampered sessions
 * - Safe redirect origins only
 *
 * Last Updated: 2026-01-09
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifySession } from '@/lib/auth/session';

// SECURITY: Allowed origins for redirect URLs (prevent open redirect attacks)
const ALLOWED_ORIGINS = [
  'https://verchem.xyz',
  'https://www.verchem.xyz',
  'https://verchem.vercel.app',
];

// Add localhost in development
if (process.env.NODE_ENV !== 'production') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

// This is a placeholder. In a real app, you'd fetch this from your database
// or a more sophisticated pricing configuration.
const PREMIUM_PLAN_PRICE_ID = 'price_1P6qj3RxH3p0z2nF6Zz2yX7j'; // REPLACE WITH YOUR ACTUAL PRICE ID

// Get safe origin for redirects
function getSafeOrigin(): string {
  // Always use server-side config, never trust client headers
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl && ALLOWED_ORIGINS.includes(siteUrl)) {
    return siteUrl;
  }

  // Fallback to primary production URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://verchem.xyz';
  }

  return 'http://localhost:3000';
}

export async function POST(_req: NextRequest) {
  try {
    // Use our session verification instead of next-auth
    const session = await verifySession();

    if (!session?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // SECURITY: Use server-side origin, not client-provided header
    const origin = getSafeOrigin();

    // Create a checkout session in Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: PREMIUM_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: session.email, // Pre-fill the user's email
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`, // Redirect here on success
      cancel_url: `${origin}/account`, // Redirect here on cancellation
    });

    if (!checkoutSession.url) {
        throw new Error("Could not create checkout session");
    }

    return NextResponse.json({ url: checkoutSession.url });

  } catch (err: unknown) {
    console.error('STRIPE_ERROR:', err);
    return new NextResponse(JSON.stringify({ error: 'Error creating checkout session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
