import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getServerSession } from "next-auth/next"

// This is a placeholder. In a real app, you'd fetch this from your database
// or a more sophisticated pricing configuration.
const PREMIUM_PLAN_PRICE_ID = 'price_1P6qj3RxH3p0z2nF6Zz2yX7j'; // REPLACE WITH YOUR ACTUAL PRICE ID

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

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
      customer_email: session.user.email, // Pre-fill the user's email
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`, // Redirect here on success
      cancel_url: `${origin}/account`, // Redirect here on cancellation
    });

    if (!checkoutSession.url) {
        throw new Error("Could not create checkout session");
    }

    return NextResponse.json({ url: checkoutSession.url });

  } catch (err: any) {
    console.error('STRIPE_ERROR:', err);
    return new NextResponse(JSON.stringify({ error: 'Error creating checkout session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
