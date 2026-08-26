/**
 * Canonical AIVerID session identity helpers.
 *
 * AIVerID member ids are opaque strings. Never parse them, and never replace
 * them with the local Supabase users.id UUID. The database UUID is useful only
 * as an implementation detail and is stored separately as db_id.
 */

export interface CanonicalSessionUser {
  id: string
  aiverid: string
  db_id?: string
  name: string
  /** AIVerID verification level. Invalid/missing claims always fail down to 1. */
  verification_level: 1 | 2 | 3 | 4
  email?: string
  subscription_tier: 'free'
  registered_at: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

function verificationLevel(value: unknown): 1 | 2 | 3 | 4 {
  return value === 1 || value === 2 || value === 3 || value === 4 ? value : 1
}

/** Resolve the hub identity in Identity Standard order: aiverid, sub, legacy id. */
export function resolveCanonicalAiverId(user: unknown): string | null {
  const record = asRecord(user)
  if (!record) return null

  return nonEmptyString(record.aiverid)
    ?? nonEmptyString(record.sub)
    ?? nonEmptyString(record.id)
}

export function createCanonicalSessionUser(
  userInfo: unknown,
  aiverid: string
): CanonicalSessionUser {
  const record = asRecord(userInfo) ?? {}
  const email = nonEmptyString(record.email)
  const displayName = nonEmptyString(record.name)
    ?? nonEmptyString(record.username)
    ?? email?.split('@')[0]
    ?? 'User'
  const registeredAt = nonEmptyString(record.registered_at)
    ?? nonEmptyString(record.created_at)

  return {
    // id remains a compatibility alias for the canonical hub id. Local UUIDs
    // are kept only in db_id so authorization can never switch namespaces.
    id: aiverid,
    aiverid,
    name: displayName,
    verification_level: verificationLevel(record.verification_level),
    ...(email ? { email } : {}),
    subscription_tier: 'free',
    registered_at: registeredAt,
  }
}

/** Merge display data from Supabase without allowing it to replace identity. */
export function mergeDatabaseUser(
  sessionUser: CanonicalSessionUser,
  databaseUser: unknown
): CanonicalSessionUser {
  const record = asRecord(databaseUser)
  if (!record) return sessionUser

  const databaseId = nonEmptyString(record.id)
  const databaseName = nonEmptyString(record.name)
  const databaseEmail = nonEmptyString(record.email)

  return {
    ...sessionUser,
    ...(databaseId ? { db_id: databaseId } : {}),
    ...(databaseName ? { name: databaseName } : {}),
    ...(databaseEmail ? { email: databaseEmail } : {}),
    // Re-assert the canonical aliases last. Even a corrupt/mismatched DB row
    // cannot change the authorization key issued by AIVerID.
    id: sessionUser.aiverid,
    aiverid: sessionUser.aiverid,
    verification_level: sessionUser.verification_level,
  }
}

/**
 * Gracefully apply optional DB sync while keeping the hub identity stable.
 * OAuth login must remain usable when the database is unavailable.
 */
export async function applyDatabaseUserSync(
  sessionUser: CanonicalSessionUser,
  sync: () => Promise<unknown>,
  onError?: (error: unknown) => void
): Promise<CanonicalSessionUser> {
  try {
    const databaseUser = await sync()
    return databaseUser ? mergeDatabaseUser(sessionUser, databaseUser) : sessionUser
  } catch (error) {
    onError?.(error)
    return sessionUser
  }
}
