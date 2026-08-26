import { NextRequest } from 'next/server'
import { inviteMemberHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  return inviteMemberHandler(request, (await params).org)
}
