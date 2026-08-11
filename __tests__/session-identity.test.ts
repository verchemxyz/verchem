/**
 * Canonical session identity regressions.
 *
 * Proves that local database UUIDs never become authorization keys, database
 * failure cannot change identity, and molecule/card consumers scope by the
 * canonical AIVerID value across separate login sessions.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  applyDatabaseUserSync,
  createCanonicalSessionUser,
  resolveCanonicalAiverId,
} from '@/lib/auth/session-identity'
import { parseVerifiedSessionPayload } from '@/lib/auth/session'

type TestFn = () => void | Promise<void>
interface TestCase { name: string; fn: TestFn }

const tests: TestCase[] = []
const AIVERID = 'TH-OPAQUE-IDENTITY-001'
const LOCAL_DATABASE_UUID = '2f47e341-a5a3-41d0-8fd4-bb327c1f1a2c'
const FUTURE_EXPIRY = '2099-01-01T00:00:00.000Z'

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function verifiedUserId(user: unknown): string {
  const session = parseVerifiedSessionPayload({ user, expires_at: FUTURE_EXPIRY })
  assert.ok(session)
  return session.userId
}

test('aiverid/sub win over a different local id without parsing the opaque value', () => {
  assert.equal(resolveCanonicalAiverId({
    id: LOCAL_DATABASE_UUID,
    sub: 'TH-SUB-FALLBACK',
    aiverid: AIVERID,
  }), AIVERID)
  assert.equal(resolveCanonicalAiverId({
    id: LOCAL_DATABASE_UUID,
    sub: 'TH-SUB-FALLBACK',
  }), 'TH-SUB-FALLBACK')
})

test('database users.id is retained only as db_id and every DB write key stays canonical', async () => {
  const baseUser = createCanonicalSessionUser({
    aiverid: AIVERID,
    email: 'member@example.com',
    name: 'Hub Name',
  }, AIVERID)
  const syncedUser = await applyDatabaseUserSync(baseUser, async () => ({
    id: LOCAL_DATABASE_UUID,
    aiverid: 'TH-MISMATCHED-DATABASE-VALUE',
    email: 'database@example.com',
    name: 'Database Name',
  }))

  assert.equal(syncedUser.id, AIVERID)
  assert.equal(syncedUser.aiverid, AIVERID)
  assert.equal(syncedUser.db_id, LOCAL_DATABASE_UUID)
  assert.equal(verifiedUserId(syncedUser), AIVERID)

  const moleculesRoute = source('app/api/molecules/route.ts')
  const moleculeRoute = source('app/api/molecules/[id]/route.ts')
  const cardsRoute = source('app/api/answer-cards/route.ts')
  const cardRoute = source('app/api/answer-cards/[id]/route.ts')
  assert.ok(moleculesRoute.includes('aiverid: session.userId'))
  assert.ok(moleculesRoute.includes('listMoleculesByUser(session.userId)'))
  assert.ok(moleculeRoute.includes('getMoleculeForUser(id, session.userId)'))
  assert.ok(moleculeRoute.includes('updateMolecule(id, session.userId, input)'))
  assert.ok(moleculeRoute.includes('deleteMolecule(id, session.userId)'))
  assert.ok(cardsRoute.includes('aiverid: session.userId'))
  assert.ok(cardsRoute.includes('listAnswerCardsByUser(session.userId)'))
  assert.ok(cardRoute.includes('getAnswerCardForUser(id, session.userId)'))
  assert.ok(cardRoute.includes('setAnswerCardVisibility(id, session.userId'))
  assert.ok(cardRoute.includes('deleteAnswerCard(id, session.userId)'))
})

test('failed database sync leaves login userId identical to a normal synced login', async () => {
  const baseUser = createCanonicalSessionUser({ aiverid: AIVERID }, AIVERID)
  const normalUser = await applyDatabaseUserSync(baseUser, async () => ({
    id: LOCAL_DATABASE_UUID,
    aiverid: AIVERID,
  }))
  let observedFailure = false
  const degradedUser = await applyDatabaseUserSync(
    baseUser,
    async () => { throw new Error('database unavailable') },
    () => { observedFailure = true }
  )

  assert.equal(observedFailure, true)
  assert.equal(verifiedUserId(normalUser), AIVERID)
  assert.equal(verifiedUserId(degradedUser), AIVERID)
})

test('a molecule created in one session is owned by the next session for the same member', async () => {
  const firstUser = await applyDatabaseUserSync(
    createCanonicalSessionUser({ sub: AIVERID }, AIVERID),
    async () => ({ id: LOCAL_DATABASE_UUID, aiverid: AIVERID })
  )
  const nextUser = await applyDatabaseUserSync(
    createCanonicalSessionUser({ aiverid: AIVERID }, AIVERID),
    async () => { throw new Error('second-login upsert failed') }
  )

  const storedMolecule = { id: 'molecule-1', aiverid: verifiedUserId(firstUser) }
  assert.equal(storedMolecule.aiverid, verifiedUserId(nextUser))
})

async function runTests() {
  let passed = 0
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      await fn()
      passed++
      console.log(`  ✅ ${name}`)
    } catch (error) {
      failed++
      console.error(`  ❌ ${name}`)
      console.error('    ', error instanceof Error ? error.message : error)
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

console.log('Session Identity Tests')
runTests().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
