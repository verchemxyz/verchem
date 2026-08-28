/**
 * Lab-QC end-to-end walkthrough over real HTTP.
 *
 * Why this exists: two shipped defects (the TIMESTAMPTZ audit-chain break and
 * the unreachable archive route) both lived in a layer no test touched. The
 * contract tests call route handlers directly against a recording fake; the
 * integration gate calls the repository directly against real Postgres.
 * Nothing exercised the combination a customer actually uses:
 *
 *   Next router → proxy → route handler → session HMAC → live membership/role
 *   → real Postgres → signed evidence pack → public verification surface.
 *
 * That combination is what this script drives, against a locally running dev
 * server and the local Supabase stack. Production must never be used: the walk
 * writes records and append-only audit events that cannot be deleted.
 *
 * Run it with `npm run gate:lab:e2e` (starts and stops its own server).
 */

import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { createLabRepository } from '@/lib/supabase/lab'
import { verifyCardJwsInBrowser } from '@/lib/answer-cards/browser-verifier'
import { parseSubmittedCard } from '@/lib/answer-cards/validate-card'
import { verifyChain } from '@/lib/lab/audit-chain'
import type { PrepTemplateSpec } from '@/lib/lab/types'

// The dev server reports its own origin as localhost, and the CSRF check compares
// against that origin — so the walkthrough must speak to it by the same name.
const BASE = process.env.LAB_E2E_BASE_URL ?? 'http://localhost:3100'
const SECRET = process.env.SESSION_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

const LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/
if (!SECRET) {
  console.error('SESSION_SECRET is required to mint the walkthrough sessions.')
  process.exit(2)
}
for (const [label, value] of [['LAB_E2E_BASE_URL', BASE], ['NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL]] as const) {
  if (!LOCAL.test(new URL(value || 'http://x').origin)) {
    console.error(`Refusing to run: ${label} (${value || 'unset'}) is not a local address.`)
    process.exit(2)
  }
}

const stamp = Date.now().toString(36)
const repository = createLabRepository()

interface Person { aiverid: string; name: string; email: string; level: 1 | 2 | 3 | 4 }
const OWNER: Person = { aiverid: `e2e-owner-${stamp}`, name: 'E2E Owner', email: `e2e-owner-${stamp}@example.test`, level: 1 }
const REVIEWER: Person = { aiverid: `e2e-reviewer-${stamp}`, name: 'E2E Reviewer', email: `e2e-reviewer-${stamp}@example.test`, level: 1 }
const ANALYST: Person = { aiverid: `e2e-analyst-${stamp}`, name: 'E2E Analyst', email: `e2e-analyst-${stamp}@example.test`, level: 1 }
const OUTSIDER: Person = { aiverid: `e2e-outsider-${stamp}`, name: 'E2E Outsider', email: `e2e-outsider-${stamp}@example.test`, level: 1 }

/** Mint the exact cookie pair the OAuth callback writes, signed with the same HMAC. */
function cookieFor(person: Person): string {
  const value = JSON.stringify({
    user: {
      id: person.aiverid, aiverid: person.aiverid, name: person.name, email: person.email,
      verification_level: person.level, subscription_tier: 'free', registered_at: null,
    },
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
  })
  const signature = createHmac('sha256', SECRET!).update(value).digest('base64url')
  return `verchem-session=${encodeURIComponent(value)}; verchem-session-sig=${encodeURIComponent(signature)}`
}

interface CallOptions {
  method?: string
  body?: unknown
  as?: Person
  origin?: string | null
  expect: number
}

async function call(path: string, options: CallOptions): Promise<{ status: number; json: Record<string, unknown> }> {
  const headers: Record<string, string> = {}
  if (options.as) headers.cookie = cookieFor(options.as)
  if (options.body !== undefined) headers['content-type'] = 'application/json'
  if (options.origin !== null) headers.origin = options.origin ?? BASE
  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: 'manual',
  })
  const text = await response.text()
  let json: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) json = parsed as Record<string, unknown>
  } catch { /* non-JSON responses are asserted on status alone */ }
  assert.equal(
    response.status,
    options.expect,
    `${options.method ?? 'GET'} ${path} → ${response.status} (expected ${options.expect}): ${text.slice(0, 300)}`
  )
  return { status: response.status, json }
}

/** A page must render without the dev overlay's build/runtime error markers. */
async function page(path: string, as?: Person): Promise<string> {
  const response = await fetch(`${BASE}${path}`, {
    headers: as ? { cookie: cookieFor(as) } : {},
    redirect: 'manual',
  })
  const html = await response.text()
  assert.equal(response.status, 200, `GET ${path} → ${response.status}`)
  for (const marker of ['__next_error__', 'Application error: a client-side exception']) {
    assert.ok(!html.includes(marker), `GET ${path} rendered an error page (${marker})`)
  }
  return html
}

const spec: PrepTemplateSpec = {
  schema: 'verchem-prep-template/v1',
  name: `E2E Cd standard ${stamp}`,
  target: {
    targetConc: 1000, targetVolume: 100, unit: 'mg/L', reagentPurityPercent: 99.99, reagentPurityBasis: 'mass',
    reagentForm: 'Cd metal', solvent: 'water', preparationTemperatureC: 20,
  },
  targetVolumeUnit: 'mL',
  acceptance: { relativePercent: 0.5 },
  requiredFields: ['lot', 'coa_assay', 'balance_id'],
  instructions: [],
  citations: ['EURACHEM/CITAC QUAM:2012 A1'],
}

const measurements = {
  weighedG: 0.10028, measuredMl: null, finalVolumeMl: 100, coaAssayPercent: 99.99, coaBasis: 'mass',
  temperatureC: 20, reagentLot: 'E2E-LOT', expiry: null, balanceId: 'BAL-E2E', flaskId: null, notes: '',
  equipment: {
    massStandardG: 0.00005, flaskToleranceMl: 0.1, flaskCalibrationTemperatureC: 20, fillRepeatabilitySdMl: 0.02,
    temperatureHalfWidthC: 4, volumeExpansionCoefficientPerC: null, assayToleranceHalfWidthPercent: 0.01,
  },
}

async function main(): Promise<void> {
  console.log(`Lab-QC HTTP walkthrough → ${BASE} (Supabase ${SUPABASE_URL})\n`)

  console.log('1. anonymous callers are refused before any database work')
  await call('/api/lab/orgs', { method: 'POST', body: { name: 'Nope' }, expect: 401 })
  await call('/api/lab/orgs', { method: 'POST', body: { name: 'Nope' }, as: OWNER, origin: 'https://evil.example', expect: 403 })
  // A page navigation is redirected to the sign-in prompt; an API call is not.
  const anonymousPage = await fetch(`${BASE}/lab`, { redirect: 'manual' })
  assert.equal(anonymousPage.status, 307)
  assert.match(String(anonymousPage.headers.get('location')), /login_required=1/)

  console.log('2. owner creates the laboratory through the API the page calls')
  const created = await call('/api/lab/orgs', {
    method: 'POST', as: OWNER, expect: 201,
    body: { name: `E2E Lab ${stamp}`, country: 'TH', accreditation_ref: `TISI-${stamp}` },
  })
  const orgId = String(created.json.id)
  assert.match(orgId, /^[0-9a-f-]{36}$/)
  const duplicate = await call('/api/lab/orgs', {
    method: 'POST', as: OUTSIDER, expect: 409, body: { name: `E2E Lab ${stamp}` },
  })
  assert.match(String(duplicate.json.error), /name is already taken/i)
  const listed = await call('/api/lab/orgs', { as: OWNER, expect: 200 })
  assert.equal((listed.json.organizations as { id: string; role: string }[])[0]?.role, 'owner')

  console.log('3. the org really landed in the LOCAL database')
  const membership = await repository.getMembership(OWNER.aiverid)
  assert.equal(membership.length, 1, 'owner membership must exist in the local database')
  assert.equal(membership[0]!.org_id, orgId)

  console.log('4. invitations: pending until that person signs in')
  await call(`/api/lab/orgs/${orgId}/members`, {
    method: 'POST', as: OWNER, expect: 201, body: { email: REVIEWER.email, role: 'reviewer', display_name: REVIEWER.name },
  })
  await call(`/api/lab/orgs/${orgId}/members`, {
    method: 'POST', as: OWNER, expect: 201, body: { email: ANALYST.email, role: 'analyst', display_name: ANALYST.name },
  })
  const reinvited = await call(`/api/lab/orgs/${orgId}/members`, {
    method: 'POST', as: OWNER, expect: 409, body: { email: ANALYST.email, role: 'viewer' },
  })
  assert.match(String(reinvited.json.error), /already belongs to a member/i)
  const selfInvite = await call(`/api/lab/orgs/${orgId}/members`, {
    method: 'POST', as: OWNER, expect: 409, body: { email: OWNER.email, role: 'reviewer' },
  })
  assert.match(String(selfInvite.json.error), /already a member/i)
  await call(`/api/lab/orgs/${orgId}/templates`, { as: ANALYST, expect: 404 })
  // The OAuth callback claims pending invites on first sign-in; replay that step.
  assert.equal((await repository.claimPendingInvites(REVIEWER.aiverid, REVIEWER.email)).length, 1)
  assert.equal((await repository.claimPendingInvites(ANALYST.aiverid, ANALYST.email)).length, 1)
  await call(`/api/lab/orgs/${orgId}/templates`, { as: ANALYST, expect: 200 })
  // The owner's member list drives the invite screen: it must say who has not
  // signed in yet, and must not expose invited addresses to everyone else.
  const ownerView = await call(`/api/lab/orgs/${orgId}/members`, { as: OWNER, expect: 200 })
  const ownerRows = ownerView.json.members as Array<Record<string, unknown>>
  assert.equal(ownerRows.length, 3)
  assert.ok(ownerRows.some((row) => row.invited_email === ANALYST.email && typeof row.joined_at === 'string'))
  const analystView = await call(`/api/lab/orgs/${orgId}/members`, { as: ANALYST, expect: 200 })
  assert.ok((analystView.json.members as Array<Record<string, unknown>>)
    .every((row) => !Object.hasOwn(row, 'invited_email') && !Object.hasOwn(row, 'joined_at')))

  console.log('5. template: analyst cannot author, owner drafts, self-approval refused')
  await call(`/api/lab/orgs/${orgId}/templates`, { method: 'POST', as: ANALYST, body: { spec }, expect: 403 })
  const template = await call(`/api/lab/orgs/${orgId}/templates`, { method: 'POST', as: OWNER, body: { spec }, expect: 201 })
  const templateId = String(template.json.id)
  await call(`/api/lab/orgs/${orgId}/templates/${templateId}/approve`, { method: 'POST', as: OWNER, expect: 403 })
  const approved = await call(`/api/lab/orgs/${orgId}/templates/${templateId}/approve`, { method: 'POST', as: REVIEWER, expect: 200 })
  assert.equal(approved.json.status, 'approved')

  console.log('6. record: create → record measurements → live preview → submit')
  const record = await call(`/api/lab/orgs/${orgId}/records`, {
    method: 'POST', as: ANALYST, body: { template_id: templateId }, expect: 201,
  })
  const recordId = String(record.json.id)
  assert.match(String(record.json.record_no), /^PR-\d{4}-\d{6}$/)
  await call(`/api/lab/orgs/${orgId}/records/${recordId}/submit`, { method: 'POST', as: ANALYST, expect: 409 })
  const updated = await call(`/api/lab/orgs/${orgId}/records/${recordId}`, {
    method: 'PATCH', as: ANALYST, body: { measurements }, expect: 200,
  })
  const preview = updated.json.preview as { asPrepared: { value: number }; withinAcceptance: boolean }
  assert.ok(preview.withinAcceptance, 'the walkthrough fixture must land inside acceptance')
  assert.ok(Math.abs(preview.asPrepared.value - 1002.7) < 1, `unexpected as-prepared value: ${preview.asPrepared.value}`)
  await call(`/api/lab/orgs/${orgId}/records/${recordId}`, {
    method: 'PATCH', as: OWNER, body: { measurements }, expect: 403,
  })
  await call(`/api/lab/orgs/${orgId}/records/${recordId}/submit`, { method: 'POST', as: ANALYST, expect: 200 })

  console.log('7. release: preparer may not release their own record; reviewer may')
  await call(`/api/lab/orgs/${orgId}/records/${recordId}/release`, { method: 'POST', as: ANALYST, expect: 403 })
  // Exactly as the release button sends it: a record inside acceptance needs no
  // deviation reason, so the UI posts no body at all.
  const released = await call(`/api/lab/orgs/${orgId}/records/${recordId}/release`, {
    method: 'POST', as: OWNER, expect: 200,
  })
  const shareToken = String(released.json.share_token)
  assert.ok(shareToken.length > 20, 'release must return a one-time share token')
  assert.equal((released.json.record as { state: string }).state, 'released')
  assert.equal((released.json.record as { draft: unknown }).draft, null, 'draft must be cleared on release')
  assert.ok(!('share_token_hash' in (released.json.record as object)), 'share_token_hash must never leave the server')

  console.log('8. evidence pack: members and token holders only')
  await call(`/api/lab/records/${recordId}/pack.json`, { expect: 404 })
  await call(`/api/lab/records/${recordId}/pack.json?token=not-the-token`, { expect: 404 })
  const packByToken = await call(`/api/lab/records/${recordId}/pack.json?token=${encodeURIComponent(shareToken)}`, { expect: 200 })
  const packByMember = await call(`/api/lab/records/${recordId}/pack.json`, { as: ANALYST, expect: 200 })
  assert.equal(packByToken.json.signature, packByMember.json.signature)

  console.log('9. the pack verifies as a signed w3-v4 card and matches the audit chain')
  const { signature, ...payload } = packByMember.json
  const card = parseSubmittedCard({ ...payload, signature })
  assert.ok(card, 'evidence pack must parse as a signed answer card')
  // Verified the way an auditor's browser does it: published JWKS only, no server secret.
  const jwks: unknown = await (await fetch(`${BASE}/.well-known/verchem-keys.json`)).json()
  const verdict = await verifyCardJwsInBrowser(String(signature), jwks, {
    releaseManifestUrl: `${BASE}/.well-known/verchem-release.json`,
  })
  assert.ok(verdict.signatureAuthentic, `evidence-pack signature must verify: ${verdict.error}`)
  assert.equal(verdict.artifactHashMatches, true, 'provenance artifact hash must match')
  assert.equal(verdict.releaseManifest, 'matched_current', `release manifest claim: ${verdict.releaseManifest}`)
  const events = await repository.listEvents(orgId, recordId)
  const chain = verifyChain(events)
  assert.ok(chain.ok, 'audit chain must verify after a full HTTP lifecycle')
  assert.equal(card.lab_record?.record_no, String(record.json.record_no))
  // The pack pins the chain as it stood at release. Downloading it appends a
  // `view_pack` event, so the live head has moved on by design — what must hold
  // is that the sealed hash is still the hash of the event it named.
  const sealedIndex = (card.lab_record?.events_count ?? 0) - 1
  assert.equal(events[sealedIndex]?.hash, card.lab_record?.events_hash)
  assert.ok(events.length > sealedIndex + 1, 'reading the pack must itself be audited')
  assert.equal(events.at(-1)?.action, 'view_pack')

  console.log('10. public status endpoint answers without auth and leaks nothing')
  const status = await call(`/api/lab/records/${recordId}/status`, { expect: 200 })
  assert.deepEqual(Object.keys(status.json).sort(), ['state', 'superseded_by', 'voided_at'])
  assert.equal(status.json.state, 'released')

  console.log('11. released records are sealed; a second release conflicts')
  await call(`/api/lab/orgs/${orgId}/records/${recordId}`, {
    method: 'PATCH', as: ANALYST, body: { measurements }, expect: 409,
  })
  await call(`/api/lab/orgs/${orgId}/records/${recordId}/release`, { method: 'POST', as: OWNER, expect: 409 })

  console.log('12. cross-organisation access is not an oracle')
  await call('/api/lab/orgs', { method: 'POST', as: OUTSIDER, body: { name: `E2E Outside ${stamp}` }, expect: 201 })
  await call(`/api/lab/orgs/${orgId}/records`, { as: OUTSIDER, expect: 404 })
  await call(`/api/lab/orgs/${orgId}/records/${recordId}`, { as: OUTSIDER, expect: 404 })
  await call(`/api/lab/records/${recordId}/pack.json`, { as: OUTSIDER, expect: 404 })

  console.log('13. every /lab page and the public verifier render')
  for (const path of [
    '/lab', `/lab/${orgId}`, `/lab/${orgId}/templates`, `/lab/${orgId}/templates/new`, `/lab/${orgId}/templates/${templateId}`,
    `/lab/${orgId}/records`, `/lab/${orgId}/records/new`, `/lab/${orgId}/records/${recordId}`, `/lab/${orgId}/members`,
    '/verify', '/tools/verified-calculation',
  ]) {
    await page(path, OWNER)
    console.log(`  ✓ ${path}`)
  }

  console.log('14. void keeps the record verifiable and updates the public status')
  await call(`/api/lab/orgs/${orgId}/records/${recordId}/void`, {
    method: 'POST', as: OWNER, body: { reason: 'walkthrough cleanup' }, expect: 200,
  })
  const voided = await call(`/api/lab/records/${recordId}/status`, { expect: 200 })
  assert.equal(voided.json.state, 'voided')
  const packAfterVoid = await call(`/api/lab/records/${recordId}/pack.json?token=${encodeURIComponent(shareToken)}`, { expect: 200 })
  assert.equal(packAfterVoid.json.signature, packByMember.json.signature, 'voiding must not alter the signed pack')

  console.log('\nLab-QC HTTP walkthrough: ALL PASSED')
}

main().catch((error: unknown) => {
  console.error('\nLab-QC HTTP walkthrough FAILED:', error)
  process.exit(1)
})
