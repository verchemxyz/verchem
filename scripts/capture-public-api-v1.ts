import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { NextRequest } from 'next/server'

import {
  capturePublicApiV1Fixtures,
  type PublicApiV1Handlers,
} from '../__tests__/support/public-api-v1-golden'

type GetWithRequest = (request: NextRequest) => Promise<Response>
const FIXED_TIME = '2026-08-10T00:00:00.000Z'
const baselineCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const expectedBaseline = process.env.VERCHEM_API_BASELINE
if (expectedBaseline && !/^[0-9a-f]{7,40}$/i.test(expectedBaseline)) {
  throw new Error('VERCHEM_API_BASELINE must be a 7–40 character Git commit ID')
}
if (expectedBaseline && !baselineCommit.toLowerCase().startsWith(expectedBaseline.toLowerCase())) {
  throw new Error(
    `Capture tree is ${baselineCommit}, not requested baseline ${expectedBaseline}`
  )
}
const dirtyTree = execFileSync(
  'git',
  ['status', '--porcelain', '--untracked-files=no'],
  { encoding: 'utf8' }
).trim()
if (dirtyTree !== '') {
  throw new Error('Refusing to label a dirty capture tree as a committed baseline')
}
const NativeDate = Date

class FrozenDate extends NativeDate {
  constructor(value?: string | number | Date) {
    if (value === undefined) super(FIXED_TIME)
    else super(value)
  }

  static now(): number {
    return NativeDate.parse(FIXED_TIME)
  }
}

globalThis.Date = FrozenDate as DateConstructor

async function loadRoute<T>(relativePath: string): Promise<T> {
  const url = pathToFileURL(`${process.cwd()}/${relativePath}`).href
  const loaded = await import(url) as T & { default?: T }
  return loaded.default ?? loaded
}

async function main(): Promise<void> {
  const indexModule = await loadRoute<{ GET: PublicApiV1Handlers['getIndex'] }>(
    'app/api/chemistry/route.ts'
  )
  const elementsModule = await loadRoute<{ GET: PublicApiV1Handlers['getElements'] }>(
    'app/api/chemistry/elements/route.ts'
  )
  const compoundsModule = await loadRoute<{ GET: PublicApiV1Handlers['getCompounds'] }>(
    'app/api/chemistry/compounds/route.ts'
  )
  const convertModule = await loadRoute<{
    GET: GetWithRequest
    OPTIONS: () => Promise<Response>
  }>('app/api/chemistry/convert/route.ts')
  const molarMassModule = await loadRoute<{ GET: PublicApiV1Handlers['getMolarMass'] }>(
    'app/api/chemistry/molar-mass/route.ts'
  )
  const phModule = await loadRoute<{ GET: PublicApiV1Handlers['getPH'] }>(
    'app/api/chemistry/ph/route.ts'
  )
  const handlers: PublicApiV1Handlers = {
    getIndex: indexModule.GET,
    getElements: elementsModule.GET,
    getCompounds: compoundsModule.GET,
    getConvert: convertModule.GET,
    optionsConvert: convertModule.OPTIONS,
    getMolarMass: molarMassModule.GET,
    getPH: phModule.GET,
  }
  const fixtures = await capturePublicApiV1Fixtures(handlers)

  console.log(JSON.stringify({ baseline: baselineCommit, fixedTime: FIXED_TIME, fixtures }, null, 2))
}

void main()
