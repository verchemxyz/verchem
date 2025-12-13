import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function sanitizeRedirectPath(value: string | null): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  if (value.includes('://')) return '/'
  if (value.includes('\\')) return '/'
  return value
}

// Lazily initialize Supabase Admin Client when environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const hasSupabaseCredentials =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.length > 0 &&
  typeof supabaseServiceKey === 'string' &&
  supabaseServiceKey.length > 0

const supabaseAdmin: SupabaseClient | null = hasSupabaseCredentials
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

if (!hasSupabaseCredentials && process.env.NODE_ENV !== 'production') {
  console.warn('Supabase admin client not initialized: missing credentials')
}

// Compute session signature using HMAC-SHA256
// SECURITY: No default secret - SESSION_SECRET is required in production
async function computeSessionSignature(value: string): Promise<string> {
  const secret = process.env.SESSION_SECRET

  // This should never happen in production due to the check below,
  // but we throw to be safe
  if (!secret) {
    throw new Error('SESSION_SECRET is required for session signing')
  }

  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(value))
  const bytes = new Uint8Array(sig)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('OAuth callback started')
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (process.env.NODE_ENV !== 'production') {
      console.log('OAuth params:', { code: code?.substring(0, 10) + '...', state, error })
    }

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
    }

    if (!code) {
      console.error('No authorization code provided')
      return NextResponse.redirect(new URL('/?error=no_code', request.url))
    }

    // Verify OAuth state (protect against CSRF)
    // SECURITY: Strict enforcement - reject on mismatch or missing state
    const cookieStore = await cookies()
    const cookieState = cookieStore.get('oauth_state')?.value

    if (!state) {
      console.error('OAuth state parameter missing from callback URL')
      return NextResponse.redirect(new URL('/?error=csrf_missing_state', request.url))
    }

    if (!cookieState) {
      console.error('OAuth state cookie missing - possible CSRF attack or cookie expired')
      return NextResponse.redirect(new URL('/?error=csrf_cookie_missing', request.url))
    } else if (cookieState !== state) {
      console.error('OAuth state mismatch - CSRF attack detected!')
      console.error(`Expected: ${cookieState.substring(0, 10)}..., Got: ${state.substring(0, 10)}...`)
      return NextResponse.redirect(new URL('/?error=csrf_state_mismatch', request.url))
    }

    // Determine redirect URI - must match exactly what was sent in authorize
    // Use dynamic origin to match how user accessed the site (www or non-www)
    const requestUrl = new URL(request.url)
    const isLocalhost = requestUrl.hostname === 'localhost' ||
                        requestUrl.hostname === '127.0.0.1'

    let redirect_uri: string
    if (isLocalhost) {
      redirect_uri = `${requestUrl.protocol}//${requestUrl.host}/oauth/callback`
    } else {
      // For production, use the same origin that the callback came from
      // This matches what frontend sent (www or non-www)
      redirect_uri = `${requestUrl.protocol}//${requestUrl.host}/oauth/callback`
    }

    if (process.env.NODE_ENV !== 'production') {
      console.info('OAuth callback received')
      console.info('Using redirect_uri:', redirect_uri)
    }

    // Get client secret from environment
    const clientSecret = process.env.AIVERID_CLIENT_SECRET
    const clientId = process.env.NEXT_PUBLIC_AIVERID_CLIENT_ID || 'aiv_verchem_production_2025'

    if (process.env.NODE_ENV !== 'production') {
      console.log('Config check:', {
        hasClientSecret: !!clientSecret,
        clientId,
        redirect_uri
      })
    }

    if (!clientSecret) {
      console.error('AIVERID_CLIENT_SECRET not configured')
      return NextResponse.redirect(new URL('/?error=server_config', request.url))
    }

    // Enforce SESSION_SECRET in production
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
      console.error('SESSION_SECRET is required in production')
      return NextResponse.redirect(new URL('/?error=server_config', request.url))
    }

    // Exchange code for token
    const tokenPayload = {
      grant_type: 'authorization_code',
      client_id: process.env.NEXT_PUBLIC_AIVERID_CLIENT_ID || 'aiv_verchem_production_2025',
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirect_uri
    }

    const formBody = new URLSearchParams(tokenPayload).toString()

    const tokenUrl = process.env.NEXT_PUBLIC_AIVERID_TOKEN_URL ||
      'https://aiverid-backend-production.up.railway.app/oauth/token'

    if (process.env.NODE_ENV !== 'production') {
      console.log('Token exchange:', {
        url: tokenUrl,
        clientId: tokenPayload.client_id,
        hasSecret: !!tokenPayload.client_secret,
        redirect_uri: tokenPayload.redirect_uri
      })
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formBody
    })

    const responseText = await tokenResponse.text()

    // Check if response is HTML (error page) instead of JSON
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('Received HTML instead of JSON from token endpoint')
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
    }

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', responseText)
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
    }

    let tokens
    try {
      tokens = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse token response as JSON:', e)
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
    }

    // Fetch user info from AIVerID
    const userResponse = await fetch(
      process.env.NEXT_PUBLIC_AIVERID_USERINFO_URL ||
      'https://aiverid-backend-production.up.railway.app/oauth/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      }
    )

    if (!userResponse.ok) {
      console.error('Failed to fetch user info')
      return NextResponse.redirect(new URL('/?error=user_fetch_failed', request.url))
    }

    const user = await userResponse.json()

    // Debug: Log user data only in development (avoid PII in production logs)
    if (process.env.NODE_ENV !== 'production') {
      console.log('AIVerID user data:', JSON.stringify(user, null, 2))
    }

    // Get AIVerID value (consistent field name)
    const aiveridValue = user.aiverid || user.sub || user.id

    // Create session data
    const sessionTtlSeconds = 7 * 24 * 60 * 60 // 7 days
    const sessionData = {
      user: {
        id: aiveridValue,
        aiverid: aiveridValue,
        name: user.name || user.username || user.email?.split('@')[0] || 'User',
        email: user.email,
        subscription_tier: 'free', // Default tier (VerCal ecosystem)
        // Early Bird: Registration date from AIVerID
        registered_at: user.registered_at || user.created_at || null,
      },
      // Tokens are intentionally NOT stored in cookies (reduce risk + cookie size).
      // Re-authenticate when the session expires.
      expires_at: new Date(Date.now() + sessionTtlSeconds * 1000).toISOString(),
    }

    // Check if user exists in database
    if (supabaseAdmin) {
      const { data: existingUser, error: dbError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('aiverid_id', aiveridValue)
        .maybeSingle()

      if (dbError && dbError.code !== 'PGRST116') {
        console.error('Database error:', dbError)
      }

      // If user doesn't exist, create one
      if (!existingUser) {
        const newUserData = {
          aiverid_id: aiveridValue,
          name: user.name || user.username || user.email?.split('@')[0] || 'User',
          email: user.email,
          // created_at will use DEFAULT CURRENT_TIMESTAMP from schema
        }

        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert(newUserData)
          .select()
          .single()

        if (createError) {
          console.error('Failed to create user:', createError)
          return NextResponse.redirect(new URL('/?error=user_creation_failed', request.url))
        }

        // Update session data with DB user
        if (newUser) {
          sessionData.user = { ...sessionData.user, ...newUser }
        }
      } else {
        // User exists - update session data
        sessionData.user = { ...sessionData.user, ...existingUser }
      }
    } else {
      console.info('Skipping Supabase sync: admin client not configured')
    }

    // Create session cookie
    const sessionString = JSON.stringify(sessionData)
    const signature = await computeSessionSignature(sessionString)

    const redirectCookie = cookieStore.get('oauth_redirect')?.value ?? null
    const redirectPath = sanitizeRedirectPath(redirectCookie)
    const response = NextResponse.redirect(new URL(redirectPath, request.url))

    // Set session cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: sessionTtlSeconds,
    }

    response.cookies.set('verchem-session', sessionString, cookieOptions)
    response.cookies.set('verchem-session-sig', signature, cookieOptions)

    // Set client-readable auth indicator (httpOnly: false)
    // This allows client-side JavaScript to check if user is authenticated
    // before calling /api/session (prevents unnecessary 401 errors)
    response.cookies.set('verchem-auth', '1', {
      ...cookieOptions,
      httpOnly: false  // JavaScript can read this!
    })

    // Clear oauth_state cookie after successful login
    response.cookies.set('oauth_state', '', { path: '/', maxAge: 0 })
    response.cookies.set('oauth_redirect', '', { path: '/', maxAge: 0 })

    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=processing_failed', request.url))
  }
}
