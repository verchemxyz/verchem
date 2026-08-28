'use client'

import { getTranslation } from '@/lib/i18n/translations'
import type { PrepRecord, PrepTemplate, Organization } from './types'
import type { AsPreparedResult } from './as-prepared'

export class LabApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

export interface LabOrganization extends Organization {
  role: 'owner' | 'reviewer' | 'analyst' | 'viewer'
  member_aiverid: string
}

export interface LabRecordListItem {
  id: string
  record_no: string
  state: PrepRecord['state']
  outcome: PrepRecord['outcome']
  created_at: string
  template_key: string | null
  template_name: string | null
}

export interface LabRecordDetail {
  record: Omit<PrepRecord, 'share_token_hash'>
  template: PrepTemplate
  preview: AsPreparedResult | null
  preview_error: string | null
  events: Array<{ actor: string; action: string; at: string; reason: string | null }>
}

export interface LabMemberView {
  display_name: string
  role: 'owner' | 'reviewer' | 'analyst' | 'viewer'
  /** Owners only: the address an invitation was sent to. */
  invited_email?: string | null
  /** Owners only: null until that person has signed in and claimed the invitation. */
  joined_at?: string | null
}

function responseMessage(value: unknown): string | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const error = (value as Record<string, unknown>).error
  return typeof error === 'string' && error.trim().length > 0 ? error : null
}

export interface LabFetchOptions extends RequestInit {
  /** Localized client fallback when a response has no usable `{ error }` payload. */
  fallbackMessage?: string
}

function redirectForExpiredSession(): void {
  if (typeof window === 'undefined') return
  const returnTo = `${window.location.pathname}${window.location.search}`
  const destination = new URL('/', window.location.origin)
  destination.searchParams.set('login_required', '1')
  destination.searchParams.set('redirect', returnTo)
  window.location.href = destination.toString()
}

/** Typed, same-origin Lab-QC request boundary for every client surface. */
export async function labFetch<T>(path: string, options: LabFetchOptions = {}): Promise<T> {
  const { fallbackMessage = getTranslation('en').lab.unknownError, ...init } = options
  const headers = new Headers(init.headers)
  if (init.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  })
  let payload: unknown = null
  try {
    payload = await response.json() as unknown
  } catch {
    if (!response.ok) throw new LabApiError(fallbackMessage, response.status)
  }
  if (!response.ok) {
    if (response.status === 401) redirectForExpiredSession()
    throw new LabApiError(responseMessage(payload) ?? fallbackMessage, response.status)
  }
  return payload as T
}

export function formatLabNumber(value: number | null, maximumFractionDigits = 6): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    useGrouping: false,
  }).format(value)
}

export function formatLabDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-GB', {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(date)
}
