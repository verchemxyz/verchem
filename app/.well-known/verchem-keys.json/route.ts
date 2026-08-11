import { NextResponse } from 'next/server'
import { getPublishedPublicKeys } from '@/lib/answer-cards/signing-key'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET(): NextResponse {
  return NextResponse.json(
    { keys: getPublishedPublicKeys() },
    {
      headers: {
        // No stale-while-revalidate: the two-phase rotation runbook promises a
        // new kid becomes visible within max-age; a stale window would let a
        // cached keyset reject fresh cards long after activation.
        'Cache-Control': 'public, max-age=3600, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  )
}
