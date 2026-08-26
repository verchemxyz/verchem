import { NextRequest } from 'next/server'
import { createOrganizationHandler, listOrganizationsHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'

export function GET(request: NextRequest) {
  return listOrganizationsHandler(request)
}

export function POST(request: NextRequest) {
  return createOrganizationHandler(request)
}
