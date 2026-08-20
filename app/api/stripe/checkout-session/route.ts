/**
 * Subscription checkout is deliberately disabled.
 *
 * VerChem currently accepts optional support through fixed Stripe Payment
 * Links, but it does not sell a subscription or paid entitlement. Keeping an
 * executable checkout endpoint with an orphaned Price ID would risk charging
 * a user for a product that the application cannot provision.
 */

import { NextResponse } from 'next/server'

export function POST(): NextResponse {
  return NextResponse.json(
    {
      error: 'Subscription checkout is not available. All VerChem features are currently free.',
      support: '/support',
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
