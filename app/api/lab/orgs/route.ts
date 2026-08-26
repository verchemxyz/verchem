import { NextRequest } from 'next/server'
import { createOrganizationHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'

export function POST(request: NextRequest) {
  return createOrganizationHandler(request)
}
