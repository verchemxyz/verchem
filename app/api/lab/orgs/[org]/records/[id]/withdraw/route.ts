import { NextRequest } from 'next/server'
import { withdrawRecordHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string; id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { org, id } = await params
  return withdrawRecordHandler(request, org, id)
}
