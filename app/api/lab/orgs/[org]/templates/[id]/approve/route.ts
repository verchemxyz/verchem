import { NextRequest } from 'next/server'
import { approveTemplateHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string; id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { org, id } = await params
  return approveTemplateHandler(request, org, id)
}
