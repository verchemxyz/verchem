import { NextRequest } from 'next/server'
import { createTemplateHandler, listTemplatesHandler } from '@/lib/lab/api'

export const runtime = 'nodejs'
interface Params { params: Promise<{ org: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  return listTemplatesHandler(request, (await params).org)
}

export async function POST(request: NextRequest, { params }: Params) {
  return createTemplateHandler(request, (await params).org)
}
