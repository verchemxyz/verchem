/** Anonymous-access contract for public, local-only chemistry tools. */

import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
// Next's own path-to-regexp build — the same compiler Next applies to
// config.matcher, so these assertions exercise the real production matcher.
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp'

import { proxy, config } from '@/proxy'

function assertMatcherContract(): void {
  const matchers = config.matcher.map((pattern: string) => pathToRegexp(pattern))
  const matchesProxy = (pathname: string) => matchers.some((re) => re.test(pathname))

  // Dotted paths under protected branches MUST reach the proxy: a blanket
  // extension exclusion here is exactly the auth bypass this contract pins.
  for (const pathname of [
    '/account/cards/some.png',
    '/account/cards/some.json',
    '/preferences/export.json',
    '/logo.png',
    '/sw.js',
  ]) {
    assert.ok(matchesProxy(pathname), `${pathname} must be routed through the proxy matcher`)
  }

  for (const pathname of ['/_next/static/chunks/a.js', '/_next/image', '/favicon.ico']) {
    assert.ok(!matchesProxy(pathname), `${pathname} must stay excluded from the proxy matcher`)
  }
}

async function assertAnonymousPasses(pathname: string): Promise<void> {
  const response = await proxy(new NextRequest(`https://verchem.xyz${pathname}`))
  assert.equal(response.status, 200, `${pathname} must not redirect an anonymous visitor`)
  assert.equal(response.headers.get('location'), null, `${pathname} must not point to login`)
  assert.equal(response.headers.get('x-middleware-next'), '1', `${pathname} must continue to the route`)
}

async function run(): Promise<void> {
  assertMatcherContract()

  await assertAnonymousPasses('/tools/ph-calculator')
  await assertAnonymousPasses('/solutions')
  // Front-door featured tools must complete anonymously (Stage 0 contract).
  await assertAnonymousPasses('/draw')
  await assertAnonymousPasses('/tools/substructure-search')
  await assertAnonymousPasses('/tools/verified-calculation')
  await assertAnonymousPasses('/verify')
  // Lab-QC exposes only independent verification endpoints without a session;
  // all organization-scoped Lab paths are proxy-gated before their handlers run.
  await assertAnonymousPasses('/api/lab/records/00000000-0000-4000-8000-000000000010/status')
  await assertAnonymousPasses('/api/lab/records/00000000-0000-4000-8000-000000000010/status/')
  await assertAnonymousPasses('/api/lab/records/00000000-0000-4000-8000-000000000010/pack.json')
  await assertAnonymousPasses('/api/lab/records/00000000-0000-4000-8000-000000000010/pack.json/')

  // 2026-08-11 (พี่จ๊อบเคาะ): every local-compute tool and reference surface is
  // open to anonymous visitors — growth first, Free tier as decided.
  for (const pathname of [
    '/calculators',
    '/gas-laws',
    '/stoichiometry',
    '/thermodynamics',
    '/electrochemistry',
    '/kinetics',
    '/equation-balancer',
    '/periodic-table',
    '/vsepr',
    '/electron-config',
    '/lewis',
    '/3d-viewer',
    '/virtual-lab',
    '/unit-converter',
    '/practice',
    '/challenge',
    '/compounds',
    '/elements',
    '/organic',
    '/spectroscopy',
    '/tutorials',
    '/search',
    // Prefix boundaries: descendants of public routes stay public.
    '/elements/H',
    '/organic/reactions/grignard',
    '/compounds/water',
  ]) {
    await assertAnonymousPasses(pathname)
  }

  // Static asset shortcut still works outside protected branches.
  const staticAsset = await proxy(new NextRequest('https://verchem.xyz/logo.png'))
  assert.equal(staticAsset.headers.get('x-middleware-next'), '1', 'public static assets must pass straight through')

  // Identity-bound surfaces stay gated, including their descendants — and
  // dotted descendants must never slip through the static-file shortcut.
  for (const pathname of [
    '/preferences',
    '/preferences/export',
    '/preferences/export.json',
    '/account',
    '/account/molecules',
    '/account/cards/some-card-id',
    '/account/cards/some.json',
    '/account/cards/some.png',
    '/api/lab/orgs/00000000-0000-4000-8000-000000000001/records',
    '/api/lab/orgs/00000000-0000-4000-8000-000000000001/records/',
  ]) {
    const protectedResponse = await proxy(new NextRequest(`https://verchem.xyz${pathname}`))
    assert.equal(protectedResponse.status, 307, `${pathname} must remain gated for anonymous visitors`)
    assert.match(protectedResponse.headers.get('location') ?? '', /login_required=1/)
  }

  console.log('Public route access tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
