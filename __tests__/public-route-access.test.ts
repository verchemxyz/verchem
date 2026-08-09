/** Anonymous-access contract for public, local-only chemistry tools. */

import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

import { proxy } from '@/proxy'

async function assertAnonymousPasses(pathname: string): Promise<void> {
  const response = await proxy(new NextRequest(`https://verchem.xyz${pathname}`))
  assert.equal(response.status, 200, `${pathname} must not redirect an anonymous visitor`)
  assert.equal(response.headers.get('location'), null, `${pathname} must not point to login`)
  assert.equal(response.headers.get('x-middleware-next'), '1', `${pathname} must continue to the route`)
}

async function run(): Promise<void> {
  await assertAnonymousPasses('/tools/ph-calculator')
  await assertAnonymousPasses('/solutions')

  const protectedResponse = await proxy(new NextRequest('https://verchem.xyz/gas-laws'))
  assert.equal(protectedResponse.status, 307, 'unrelated protected calculators must remain gated')
  assert.match(protectedResponse.headers.get('location') ?? '', /login_required=1/)

  console.log('Public route access tests passed')
}

run().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
