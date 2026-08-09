import { NextResponse } from 'next/server'

export const PUBLIC_API_VERSION = '2.0.0' as const
export const PUBLIC_API_MIGRATION_PATH = '/api/chemistry/v2' as const

export function applyPublicApiVersionHeaders(headers: Headers): void {
  headers.set('X-API-Version', PUBLIC_API_VERSION)
  headers.set('X-API-Migration', PUBLIC_API_MIGRATION_PATH)
}

/**
 * Every public chemistry response, including validation errors and 429s,
 * carries one body/header contract. Callers never have to infer which endpoint
 * silently moved to a different schema generation.
 */
export function publicApiJson(
  body: Record<string, unknown>,
  init: ResponseInit = {}
): NextResponse {
  const headers = new Headers(init.headers)
  applyPublicApiVersionHeaders(headers)

  return NextResponse.json(
    { ...body, apiVersion: PUBLIC_API_VERSION },
    { ...init, headers }
  )
}
