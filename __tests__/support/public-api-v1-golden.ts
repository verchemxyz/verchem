import { createRequire } from 'node:module'

import { NextRequest } from 'next/server'

export interface ResponseSnapshot {
  status: number
  headers: Record<string, string>
  body: unknown
}

type GetWithRequest = (request: NextRequest) => Promise<Response>
type GetWithoutRequest = () => Promise<Response>
type OptionsWithoutRequest = () => Promise<Response>

export interface PublicApiV1Handlers {
  getIndex: GetWithoutRequest
  getElements: GetWithRequest
  getCompounds: GetWithRequest
  getConvert: GetWithRequest
  optionsConvert: OptionsWithoutRequest
  getMolarMass: GetWithRequest
  getPH: GetWithRequest
}

type FrameworkRouteHandler = (request: NextRequest) => Response | Promise<Response>
type FrameworkMethodTable = Record<string, FrameworkRouteHandler>

const require = createRequire(import.meta.url)
const { autoImplementMethods } = require(
  'next/dist/server/route-modules/app-route/helpers/auto-implement-methods.js'
) as {
  autoImplementMethods: (handlers: FrameworkMethodTable) => FrameworkMethodTable
}

function request(path: string, method = 'GET'): NextRequest {
  return new NextRequest(`https://verchem.xyz${path}`, { method })
}

export async function snapshot(response: Response): Promise<ResponseSnapshot> {
  const rawBody = await response.text()
  let body: unknown = null
  if (rawBody !== '') {
    try {
      body = JSON.parse(rawBody) as unknown
    } catch {
      body = rawBody
    }
  }

  return {
    status: response.status,
    headers: Object.fromEntries(
      [...response.headers.entries()].sort(([left], [right]) => left.localeCompare(right))
    ),
    body,
  }
}

async function frameworkMethodNotAllowed(getIndex: GetWithoutRequest): Promise<Response> {
  const methods = autoImplementMethods({
    GET: () => getIndex(),
  })
  const post = methods.POST
  if (!post) throw new Error('Next.js did not create the POST method table entry')
  return post(request('/api/chemistry', 'POST'))
}

async function forcedConversionFailure(getConvert: GetWithRequest): Promise<Response> {
  const nativeToFixed = Number.prototype.toFixed
  Number.prototype.toFixed = function forcedGoldenFailure(): string {
    throw new Error('forced-golden-format-failure')
  }
  try {
    return await getConvert(request(
      '/api/chemistry/convert?value=100&from=C&to=F&category=temperature'
    ))
  } finally {
    Number.prototype.toFixed = nativeToFixed
  }
}

/**
 * Exercise every reachable v1 success/validation/error family. English-only
 * compound queries deliberately leave the separately-decided Thai search
 * compatibility question outside this gate.
 */
export async function capturePublicApiV1Fixtures(
  handlers: PublicApiV1Handlers
): Promise<Record<string, ResponseSnapshot>> {
  return {
    index: await snapshot(await handlers.getIndex()),
    indexMethodNotAllowed: await snapshot(await frameworkMethodNotAllowed(handlers.getIndex)),

    elementsList: await snapshot(await handlers.getElements(request('/api/chemistry/elements?limit=2'))),
    elementSodium: await snapshot(await handlers.getElements(request('/api/chemistry/elements?symbol=Na'))),
    elementLegacyNumberParsing: await snapshot(await handlers.getElements(request('/api/chemistry/elements?number=1abc'))),
    elementUnknownSymbol: await snapshot(await handlers.getElements(request('/api/chemistry/elements?symbol=Xx'))),
    elementInvalidNumber: await snapshot(await handlers.getElements(request('/api/chemistry/elements?number=119'))),
    elementUnknownCategory: await snapshot(await handlers.getElements(request('/api/chemistry/elements?category=not-real'))),
    elementInvalidLimit: await snapshot(await handlers.getElements(request('/api/chemistry/elements?limit=0'))),

    compoundsList: await snapshot(await handlers.getCompounds(request('/api/chemistry/compounds?limit=2'))),
    compoundsSearch: await snapshot(await handlers.getCompounds(request('/api/chemistry/compounds?q=acetone&limit=3'))),
    compoundsCategory: await snapshot(await handlers.getCompounds(request('/api/chemistry/compounds?category=acid&limit=2'))),
    compoundWater: await snapshot(await handlers.getCompounds(request('/api/chemistry/compounds?id=water'))),
    compoundLegacyMixtureMass: await snapshot(await handlers.getCompounds(request('/api/chemistry/compounds?id=petroleum-ether'))),
    compoundUnknown: await snapshot(await handlers.getCompounds(request('/api/chemistry/compounds?id=not-real'))),
    compoundInvalidLimit: await snapshot(await handlers.getCompounds(request('/api/chemistry/compounds?limit=0'))),

    convertOptions: await snapshot(await handlers.optionsConvert()),
    convertTemperature: await snapshot(await handlers.getConvert(request('/api/chemistry/convert?value=100&from=C&to=F&category=temperature'))),
    convertMissing: await snapshot(await handlers.getConvert(request('/api/chemistry/convert'))),
    convertInvalidCategory: await snapshot(await handlers.getConvert(request('/api/chemistry/convert?value=1&from=C&to=F&category=unknown'))),
    convertInvalidFrom: await snapshot(await handlers.getConvert(request('/api/chemistry/convert?value=1&from=bad&to=F&category=temperature'))),
    convertInvalidTo: await snapshot(await handlers.getConvert(request('/api/chemistry/convert?value=1&from=C&to=bad&category=temperature'))),
    convertInvalidValue: await snapshot(await handlers.getConvert(request('/api/chemistry/convert?value=abc&from=C&to=F&category=temperature'))),
    convertInternalError: await snapshot(await forcedConversionFailure(handlers.getConvert)),

    molarMassWater: await snapshot(await handlers.getMolarMass(request('/api/chemistry/molar-mass?formula=H2O'))),
    molarMassMissing: await snapshot(await handlers.getMolarMass(request('/api/chemistry/molar-mass'))),
    molarMassTooLong: await snapshot(await handlers.getMolarMass(request(`/api/chemistry/molar-mass?formula=${'H'.repeat(101)}`))),
    molarMassParenthesesRejected: await snapshot(await handlers.getMolarMass(request('/api/chemistry/molar-mass?formula=Ca(OH)2'))),
    molarMassUnknownElement: await snapshot(await handlers.getMolarMass(request('/api/chemistry/molar-mass?formula=Xx2'))),

    phFromH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?h=0.001'))),
    phFromOH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?oh=0.00001'))),
    phFromPH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?ph=7'))),
    phFromPOH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?poh=5'))),
    phLegacyModelFieldsIgnored: await snapshot(await handlers.getPH(request('/api/chemistry/ph?ph=7&temperature_c=80&activity_model=ideal'))),
    phLegacyPrecedence: await snapshot(await handlers.getPH(request('/api/chemistry/ph?h=0.001&ph=12'))),
    phMissing: await snapshot(await handlers.getPH(request('/api/chemistry/ph'))),
    phInvalidH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?h=0'))),
    phInvalidOH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?oh=0'))),
    phInvalidPH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?ph=15'))),
    phInvalidPOH: await snapshot(await handlers.getPH(request('/api/chemistry/ph?poh=15'))),
  }
}
