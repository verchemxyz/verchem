import { NextRequest } from 'next/server'
import { packJsonHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  return packJsonHandler(request, (await params).id)
}
