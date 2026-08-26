import { NextResponse } from 'next/server'
import {
  getArchivedReleaseManifest,
  signReleaseManifest,
} from '@/lib/answer-cards/release-manifest'
import { SigningKeyConfigurationError } from '@/lib/answer-cards/signing-key'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ARCHIVE_HASH = /^[a-f0-9]{64}$/

interface RouteContext {
  params: Promise<unknown>
}

function routeHash(params: unknown): string | null {
  if (typeof params !== 'object' || params === null || Array.isArray(params)) return null
  const hash = (params as Record<string, unknown>).hash
  return typeof hash === 'string' ? hash : null
}

export async function GET(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  const hash = routeHash(await params)
  if (!hash || !ARCHIVE_HASH.test(hash)) {
    return NextResponse.json(
      { error: 'The release manifest hash must be a lowercase SHA-256 hex digest.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  try {
    const manifest = getArchivedReleaseManifest(hash)
    if (!manifest) {
      return NextResponse.json(
        { error: 'The requested release manifest was not found.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    return NextResponse.json(
      { manifest, jws: await signReleaseManifest(manifest) },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: unknown) {
    if (error instanceof SigningKeyConfigurationError) {
      console.error('GET /.well-known/verchem-release/[hash].json unavailable:', error)
      return NextResponse.json(
        { error: 'The release manifest is temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    console.error('GET /.well-known/verchem-release/[hash].json error:', error)
    return NextResponse.json(
      { error: 'Could not publish the release manifest.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
