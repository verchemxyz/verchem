import { NextRequest } from 'next/server'
import { createRecordHandler, listRecordsHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  return listRecordsHandler(request, (await params).org)
}

export async function POST(request: NextRequest, { params }: Params) {
  return createRecordHandler(request, (await params).org)
}
