import { NextRequest } from 'next/server'
import { getTemplateHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'

interface Params { params: Promise<{ org: string; id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { org, id } = await params
  return getTemplateHandler(request, org, id)
}
