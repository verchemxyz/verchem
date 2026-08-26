import { NextRequest } from 'next/server'
import { publicStatusHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  return publicStatusHandler(request, (await params).id)
}
