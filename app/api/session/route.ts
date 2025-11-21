import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Verify session signature
async function verifySessionSignature(value: string, signature: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET || 'verchem-session-secret-2025'
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
    const expectedSig = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
    return expectedSig === signature
  } catch {
    return false
  }
}

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('verchem-session')
    const signatureCookie = cookieStore.get('verchem-session-sig')

    if (!sessionCookie || !signatureCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify signature
    const isValid = await verifySessionSignature(sessionCookie.value, signatureCookie.value)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Parse session data
    const sessionData = JSON.parse(sessionCookie.value)

    // Check if session is expired
    if (sessionData.expires_at && new Date(sessionData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    // Return user data
    return NextResponse.json({
      user: sessionData.user,
      expires_at: sessionData.expires_at,
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Session error' }, { status: 500 })
  }
}
