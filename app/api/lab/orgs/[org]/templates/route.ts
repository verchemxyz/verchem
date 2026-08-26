import { NextRequest } from 'next/server'
import { createTemplateHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  return createTemplateHandler(request, (await params).org)
}
