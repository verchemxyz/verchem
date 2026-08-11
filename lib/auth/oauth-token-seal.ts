/**
 * Stateless OAuth bearer-token confidentiality for the signed session cookie.
 *
 * AES-256-GCM provides authenticated encryption. Its key is derived from the
 * existing SESSION_SECRET with a purpose-specific HKDF info label, so no new
 * environment secret or server-side session store is required.
 *
 * Rotating SESSION_SECRET intentionally makes existing token seals impossible
 * to open. Logout will then skip hub revocation but must still clear cookies.
 */

import {
  SESSION_COOKIE_SIZE_LIMIT_BYTES,
  serializedSessionCookieSize,
} from '@/lib/auth/cookie-config'

export interface OAuthTokens {
  access_token: string
  refresh_token?: string
}

export type OAuthTokenStorageMode = 'access-and-refresh' | 'access-only' | 'none'

export interface PreparedSessionCookie {
  sessionString: string
  tokenStorage: OAuthTokenStorageMode
}

const HKDF_INFO = 'verchem-oauth-token-seal-v1'
const AES_GCM_IV_BYTES = 12
const AES_GCM_TAG_BYTES = 16
const MAX_SEALED_BLOB_LENGTH = 8_192
const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is required for OAuth token sealing')
  return secret
}

async function deriveTokenSealKey(): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sessionSecret()),
    'HKDF',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: encoder.encode(HKDF_INFO),
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.byteLength; index++) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null

  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index)
    }
    return bytes
  } catch {
    return null
  }
}

function parseOAuthTokens(value: unknown): OAuthTokens | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (typeof record.access_token !== 'string' || record.access_token.length === 0) return null

  return {
    access_token: record.access_token,
    ...(typeof record.refresh_token === 'string' && record.refresh_token.length > 0
      ? { refresh_token: record.refresh_token }
      : {}),
  }
}

/** Seal tokens as base64url(iv + ciphertext + GCM tag). */
export async function sealOAuthTokens(tokens: OAuthTokens): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES))
  const key = await deriveTokenSealKey()
  const plaintext = encoder.encode(JSON.stringify(tokens))
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: AES_GCM_TAG_BYTES * 8 },
    key,
    plaintext
  ))
  const sealed = new Uint8Array(iv.byteLength + encrypted.byteLength)
  sealed.set(iv, 0)
  sealed.set(encrypted, iv.byteLength)
  return toBase64Url(sealed)
}

/** Return null for malformed, tampered, or no-longer-decryptable token seals. */
export async function unsealOAuthTokens(sealed: string): Promise<OAuthTokens | null> {
  if (sealed.length === 0 || sealed.length > MAX_SEALED_BLOB_LENGTH) return null
  const bytes = fromBase64Url(sealed)
  if (!bytes || bytes.byteLength <= AES_GCM_IV_BYTES + AES_GCM_TAG_BYTES) return null

  try {
    const key = await deriveTokenSealKey()
    const iv = bytes.slice(0, AES_GCM_IV_BYTES)
    const ciphertextAndTag = bytes.slice(AES_GCM_IV_BYTES)
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: AES_GCM_TAG_BYTES * 8 },
      key,
      ciphertextAndTag
    )
    return parseOAuthTokens(JSON.parse(decoder.decode(plaintext)) as unknown)
  } catch {
    return null
  }
}

async function serializeWithTokens(
  baseSession: Record<string, unknown>,
  tokens: OAuthTokens
): Promise<string> {
  const sealedTokens = await sealOAuthTokens(tokens)
  return JSON.stringify({ ...baseSession, oauth_tokens: sealedTokens })
}

/**
 * Apply the two-step cookie size guard: drop refresh first, then all tokens.
 * The ordinary signed login session is always returned even when bearer tokens
 * are too large to retain for best-effort logout revocation.
 */
export async function prepareSessionCookie(
  baseSession: Record<string, unknown>,
  tokens: OAuthTokens
): Promise<PreparedSessionCookie> {
  let sessionString = await serializeWithTokens(baseSession, tokens)
  if (serializedSessionCookieSize(sessionString) <= SESSION_COOKIE_SIZE_LIMIT_BYTES) {
    return {
      sessionString,
      tokenStorage: tokens.refresh_token ? 'access-and-refresh' : 'access-only',
    }
  }

  console.warn('Session cookie size guard: refresh token omitted')
  sessionString = await serializeWithTokens(baseSession, { access_token: tokens.access_token })
  if (serializedSessionCookieSize(sessionString) <= SESSION_COOKIE_SIZE_LIMIT_BYTES) {
    return { sessionString, tokenStorage: 'access-only' }
  }

  console.warn('Session cookie size guard: OAuth tokens omitted')
  return {
    sessionString: JSON.stringify(baseSession),
    tokenStorage: 'none',
  }
}
