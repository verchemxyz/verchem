import { NextResponse } from 'next/server'
import {
  getReleaseManifest,
  ReleaseManifestMissingError,
  signReleaseManifest,
} from '@/lib/answer-cards/release-manifest'
import { SigningKeyConfigurationError } from '@/lib/answer-cards/signing-key'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  try {
    const manifest = getReleaseManifest()
    const jws = await signReleaseManifest(manifest)
    return NextResponse.json(
      { manifest, jws },
      {
        headers: {
          // Match the JWKS route. A verifier always validates the JWS itself.
          'Cache-Control': 'public, max-age=3600, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: unknown) {
    if (error instanceof ReleaseManifestMissingError || error instanceof SigningKeyConfigurationError) {
      console.error('GET /.well-known/verchem-release.json unavailable:', error)
      return NextResponse.json(
        { error: 'The release manifest is temporarily unavailable.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    console.error('GET /.well-known/verchem-release.json error:', error)
    return NextResponse.json(
      { error: 'Could not publish the release manifest.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
