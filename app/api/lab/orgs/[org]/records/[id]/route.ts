import { NextRequest } from 'next/server'
import { getRecordDetailHandler, updateRecordHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string; id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { org, id } = await params
  return getRecordDetailHandler(request, org, id)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { org, id } = await params
  return updateRecordHandler(request, org, id)
}
