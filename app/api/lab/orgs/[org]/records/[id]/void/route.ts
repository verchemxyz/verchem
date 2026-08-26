import { NextRequest } from 'next/server'
import { voidRecordHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string; id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { org, id } = await params
  return voidRecordHandler(request, org, id)
}
