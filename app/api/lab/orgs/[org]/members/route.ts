import { NextRequest } from 'next/server'
import { inviteMemberHandler, listMembersHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  return listMembersHandler(request, (await params).org)
}

export async function POST(request: NextRequest, { params }: Params) {
  return inviteMemberHandler(request, (await params).org)
}
