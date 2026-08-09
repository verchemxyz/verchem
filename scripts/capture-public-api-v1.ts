import { pathToFileURL } from 'node:url'
import { NextRequest } from 'next/server'

type GetWithRequest = (request: NextRequest) => Promise<Response>
type GetWithoutRequest = () => Promise<Response>

const FIXED_TIME = '2026-08-10T00:00:00.000Z'
const baselineLabel = process.env.VERCHEM_API_BASELINE
if (!baselineLabel || !/^[0-9a-f]{7,40}$/i.test(baselineLabel)) {
  throw new Error('Set VERCHEM_API_BASELINE to the commit checked out in the capture tree')
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

async function loadGet<T>(relativePath: string): Promise<T> {
  const url = pathToFileURL(`${process.cwd()}/${relativePath}`).href
  const loadedRoute = await import(url) as { GET: T }
  return loadedRoute.GET
}

async function snapshot(response: Response) {
  return {
    status: response.status,
    headers: Object.fromEntries(
      [...response.headers.entries()].sort(([a], [b]) => a.localeCompare(b))
    ),
    body: await response.json() as unknown,
  }
}

function request(path: string): NextRequest {
  return new NextRequest(`https://verchem.xyz${path}`)
}

async function main(): Promise<void> {
  const getIndex = await loadGet<GetWithoutRequest>('app/api/chemistry/route.ts')
  const getElements = await loadGet<GetWithRequest>('app/api/chemistry/elements/route.ts')
  const getCompounds = await loadGet<GetWithRequest>('app/api/chemistry/compounds/route.ts')
  const getConvert = await loadGet<GetWithRequest>('app/api/chemistry/convert/route.ts')
  const getMolarMass = await loadGet<GetWithRequest>('app/api/chemistry/molar-mass/route.ts')
  const getPH = await loadGet<GetWithRequest>('app/api/chemistry/ph/route.ts')

  const fixtures = {
    index: await snapshot(await getIndex()),
    elementSodium: await snapshot(await getElements(request('/api/chemistry/elements?symbol=Na'))),
    elementLegacyNumberParsing: await snapshot(await getElements(request('/api/chemistry/elements?number=1abc'))),
    compoundWater: await snapshot(await getCompounds(request('/api/chemistry/compounds?id=water'))),
    compoundLegacyMixtureMass: await snapshot(await getCompounds(request('/api/chemistry/compounds?id=petroleum-ether'))),
    compoundInvalidLimit: await snapshot(await getCompounds(request('/api/chemistry/compounds?limit=0'))),
    convertTemperature: await snapshot(await getConvert(request('/api/chemistry/convert?value=100&from=C&to=F&category=temperature'))),
    convertMissing: await snapshot(await getConvert(request('/api/chemistry/convert'))),
    molarMassWater: await snapshot(await getMolarMass(request('/api/chemistry/molar-mass?formula=H2O'))),
    molarMassParenthesesRejected: await snapshot(await getMolarMass(request('/api/chemistry/molar-mass?formula=Ca(OH)2'))),
    phLegacyModelFieldsIgnored: await snapshot(await getPH(request('/api/chemistry/ph?ph=7&temperature_c=80&activity_model=ideal'))),
    phLegacyPrecedence: await snapshot(await getPH(request('/api/chemistry/ph?h=0.001&ph=12'))),
    phMissing: await snapshot(await getPH(request('/api/chemistry/ph'))),
  }

  console.log(JSON.stringify({ baseline: baselineLabel, fixedTime: FIXED_TIME, fixtures }, null, 2))
}

void main()
