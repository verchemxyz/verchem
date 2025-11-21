import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(_request: NextRequest) {
  try {
    await cookies() // Ensure cookies are available

    // Clear all session cookies
    const response = NextResponse.json({ success: true })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0, // Delete cookie
    }

    response.cookies.set('verchem-session', '', cookieOptions)
    response.cookies.set('verchem-session-sig', '', cookieOptions)
    response.cookies.set('verchem-auth', '', { ...cookieOptions, httpOnly: false })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
