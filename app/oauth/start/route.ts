import { NextRequest, NextResponse } from 'next/server'

function sanitizeRedirectPath(value: string | null): string {
  if (!value) return '/'

  // Only allow same-origin relative paths
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  if (value.includes('://')) return '/'
  if (value.includes('\\')) return '/'

  return value
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function generateState(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64Url(bytes)
}

export async function GET(request: NextRequest) {
  const authorizeUrl = process.env.NEXT_PUBLIC_AIVERID_AUTH_URL
  const clientId = process.env.NEXT_PUBLIC_AIVERID_CLIENT_ID || 'aiv_verchem_production_2025'

  if (!authorizeUrl) {
    return NextResponse.redirect(new URL('/?error=server_config', request.url))
  }

  const redirectParam = request.nextUrl.searchParams.get('redirect')
  const redirectPath = sanitizeRedirectPath(redirectParam)

  const state = generateState()
  const redirect_uri = `${request.nextUrl.origin}/oauth/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri,
    response_type: 'code',
    scope: 'profile email',
    state,
  })

  const response = NextResponse.redirect(`${authorizeUrl}?${params.toString()}`)

  // IMPORTANT: domain must be set to share cookies between www and non-www
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60, // 10 minutes
    // Share cookies across www and non-www subdomains
    ...(isProduction && { domain: '.verchem.xyz' }),
  }

  response.cookies.set('oauth_state', state, cookieOptions)
  response.cookies.set('oauth_redirect', redirectPath, cookieOptions)

  return response
}

