/**
 * Contracts for public credibility copy and static discoverability files.
 * These fail when dataset-derived facts drift or disallowed absolute claims
 * are reintroduced.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { COMPOUND_STATISTICS } from '@/lib/data/compounds'
import { ANSWER_CARD_PAGE_SIZE, parseAnswerCardPage } from '@/lib/answer-cards/list-pagination'
import { SOLUTION_MODES, SOLUTIONS_MODE_COUNT } from '@/lib/config/solutions'
import { LLMS_TEXT } from '@/lib/seo/llms'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

const llms = LLMS_TEXT
const llmsRoute = read('app/llms.txt/route.ts')
const jsonLd = read('components/seo/JsonLd.tsx')
const support = read('app/support/page.tsx')
const layout = read('app/layout.tsx')
const solutionsLayout = read('app/solutions/layout.tsx')
const solutionsPage = read('app/solutions/page.tsx')
const legacyPHRoute = read('app/tools/ph-calculator/page.tsx')
const solutionPrepPage = read('app/tools/solution-prep/page.tsx')
const compoundDetailPage = read('app/compounds/[slug]/page.tsx')
const compoundsApi = read('lib/api/chemistry/v2/compounds.ts')
const elementsIndex = read('app/elements/page.tsx')
const pricingModel = read('PRICING_MODEL.md')
const compoundExpansion = read('COMPOUND_DATABASE_EXPANSION.md')
const serviceWorker = read('public/sw.js')
const serviceWorkerRegistration = read('components/pwa/ServiceWorkerRegistration.tsx')
const answerCardList = read('lib/supabase/answer-cards.ts')
const answerCardListApi = read('app/api/answer-cards/route.ts')
const answerCardListPage = read('app/account/cards/page.tsx')
const rootLayout = read('app/layout.tsx')
const calculatorConfig = read('lib/config/calculators.ts')
const readme = read('README.md')
const publicCredibilityCopy = [
  llms,
  jsonLd,
  layout,
  read('app/page.tsx'),
  read('app/periodic-table/page.tsx'),
  read('app/tools/molar-mass/page.tsx'),
  read('app/tools/molar-mass/layout.tsx'),
  read('app/tools/periodic-table/page.tsx'),
  read('app/tools/periodic-table/layout.tsx'),
  read('app/tools/page.tsx'),
  read('app/compounds/page.tsx'),
  elementsIndex,
  pricingModel,
  compoundExpansion,
  read('lib/utils/citations.ts'),
].join('\n')

const formattedCompoundCount = COMPOUND_STATISTICS.totalCompounds.toLocaleString('en-US')

assert.match(
  llms,
  new RegExp(`\\b${formattedCompoundCount.replace(',', '\\,')} Compound Records\\b`),
  'public/llms.txt compound count must match COMPOUND_STATISTICS'
)
assert.match(llmsRoute, /return new Response\(LLMS_TEXT/)
assert.match(llmsRoute, /text\/plain; charset=utf-8/)
assert.match(
  llms,
  new RegExp(`database of ${formattedCompoundCount.replace(',', '\\,')} compound records`, 'i'),
  'public/llms.txt FAQ count must match COMPOUND_STATISTICS'
)

assert.match(support, /COMPOUND_STATISTICS\.totalCompounds/)
assert.match(layout, /compoundCount=\{COMPOUND_STATISTICS\.totalCompounds\}/)
assert.match(jsonLd, /compoundCount.*number/)
assert.doesNotMatch(`${support}\n${layout}\n${jsonLd}`, /\b1,311\b/)

assert.doesNotMatch(llms, /\/tools\/ph-calculator/)
assert.match(llms, /https:\/\/verchem\.xyz\/solutions/)
assert.match(solutionsLayout, /canonical: 'https:\/\/verchem\.xyz\/solutions'/)
assert.equal(SOLUTIONS_MODE_COUNT, 11)
assert.equal(SOLUTIONS_MODE_COUNT, SOLUTION_MODES.length)
assert.match(llms, new RegExp(`pH Calculator\\*\\*: ${SOLUTIONS_MODE_COUNT} modes`))
assert.match(solutionsLayout, /SOLUTIONS_MODE_COUNT/)
assert.match(solutionsPage, /SOLUTIONS_MODE_COUNT/)
assert.match(solutionsPage, /SOLUTION_MODES\.map/)
assert.ok((jsonLd.match(/SOLUTIONS_MODE_COUNT/g) ?? []).length >= 3)
assert.match(calculatorConfig, /SOLUTIONS_MODE_COUNT/)
assert.match(readme, new RegExp(`Solutions & pH\\*\\* - ${SOLUTIONS_MODE_COUNT} modes`))
assert.doesNotMatch(
  `${llms}\n${jsonLd}\n${solutionsLayout}\n${solutionsPage}\n${calculatorConfig}\n${readme}`,
  /\b(?:7|seven)\s+(?:calculation\s+)?modes\b/i
)
assert.match(legacyPHRoute, /export \{ default \} from '@\/app\/solutions\/page'/)
assert.match(solutionsPage, /calculatePHConversion/)
assert.match(solutionsPage, /PH_MODEL_25C\.assumptions/)
assert.match(solutionsPage, /phResult\.method/)
assert.match(solutionsPage, /phResult\.warning/)
assert.match(solutionsPage, /parseRequiredFiniteNumber/)

assert.match(solutionPrepPage, /const \[reagentPurity, setReagentPurity\] = useState\(''\)/)
assert.match(solutionPrepPage, /const \[solvent, setSolvent\] = useState\(''\)/)
assert.match(solutionPrepPage, /const \[temperatureC, setTemperatureC\] = useState\(''\)/)
assert.match(solutionPrepPage, /This preset filled assay = 100%, solvent = water/)

assert.match(compoundDetailPage, /hasApplicableMolarMass\(compound\)/)
assert.match(compoundDetailPage, /hasMolarMass \? \{/)
assert.match(compoundsApi, /molarMassBasis: MolarMassBasis/)
assert.match(compoundsApi, /hasApplicableMolarMass\(compound\) \? compound\.molarMass : null/)
assert.match(compoundsApi, /safetyDataStatus: SafetyDataStatus/)
assert.match(compoundDetailPage, /Absence does not mean safe/)
assert.match(compoundDetailPage, /supplier Safety Data Sheet \(SDS\)/)

assert.doesNotMatch(
  publicCredibilityCopy,
  /\b(?:NIST|IUPAC)[ -](?:certified|validated)\b|\bcertified (?:atomic|element|compound) data\b|\bofficial NIST atomic weight values\b|\bNIST atomic masses are used\b|\b100% (?:complete|accurate)\b|\bcomplete (?:data|properties)\b|\bevery compound (?:has|includes|contains)\b|\beach compound includes\b|\bsupports all chemical compounds\b/i
)
assert.doesNotMatch(
  publicCredibilityCopy,
  /missing (?:density|equivalents?)[^\n.]{0,100}(?:assum|default)|(?:density|equivalents?)[^\n.]{0,100}(?:assum|default)(?:ed)? when missing/i
)
assert.match(llms, /missing value is rejected rather than guessed/i)
assert.match(llms, /Signature integrity and current-engine agreement are reported separately/)
assert.match(jsonLd, /Signature integrity and current-engine agreement are reported separately/)
const absoluteCompletenessClaim = /(?:100\s*%\s*data\s*completeness|data\s*completeness\s*:?\s*100\s*%)/i
for (const forbiddenVariant of [
  '100% Data Completeness',
  'Data Completeness: 100%',
  'Data  \n Completeness : 100 %',
]) {
  assert.match(forbiddenVariant, absoluteCompletenessClaim)
}
assert.doesNotMatch(
  `${elementsIndex}\n${pricingModel}\n${compoundExpansion}`,
  new RegExp(`verified compounds|${absoluteCompletenessClaim.source}|All 118 elements with verified atomic data`, 'i')
)
assert.match(serviceWorker, /CACHE_VERSION = 'verchem-v2\.0\.0'/)
assert.match(serviceWorker, /MIGRATED_ROUTES = \['\/tools\/ph-calculator'\]/)
assert.match(serviceWorker, /'\/solutions'/)
assert.match(serviceWorker, /async function warmStaticAssets/)
assert.ok(
  serviceWorker.indexOf('await warmStaticAssets();') < serviceWorker.indexOf("console.log('[SW] Deleting old cache:'"),
  'v2 offline routes must be warm before old caches are deleted'
)
const installBlock = serviceWorker.slice(
  serviceWorker.indexOf("self.addEventListener('install'"),
  serviceWorker.indexOf("self.addEventListener('message'")
)
assert.doesNotMatch(installBlock, /skipWaiting/)
assert.match(serviceWorker, /event\.data\?\.type === 'SKIP_WAITING'/)
assert.match(serviceWorkerRegistration, /addEventListener\('controllerchange'/)
assert.match(serviceWorkerRegistration, /reloadOnControllerChange\.current = true/)
assert.doesNotMatch(serviceWorkerRegistration, /waitingWorker\.addEventListener\('statechange'/)
assert.match(serviceWorker, /cache\.delete\(new URL\(route, self\.location\.origin\)\.toString\(\)\)/)
assert.doesNotMatch(serviceWorker, /CACHE_ON_VISIT/)

assert.equal(ANSWER_CARD_PAGE_SIZE, 20)
assert.equal(parseAnswerCardPage(null), 0)
assert.equal(parseAnswerCardPage('2'), 2)
assert.equal(parseAnswerCardPage('-1'), null)
assert.equal(parseAnswerCardPage('1.5'), null)
assert.equal(parseAnswerCardPage('not-a-page'), null)
assert.match(answerCardList, /\.range\(from, to\)/)
assert.match(answerCardList, /rowsWithLookahead\.slice\(0, ANSWER_CARD_PAGE_SIZE\)/)
assert.ok(
  answerCardList.indexOf('rowsWithLookahead.slice') < answerCardList.indexOf('const cards = await Promise.all'),
  'only the returned page may be replayed'
)
assert.match(answerCardListApi, /parseAnswerCardPage\(request\.nextUrl\.searchParams\.get\('page'\)\)/)
assert.match(answerCardListPage, /fetch\(`\/api\/answer-cards\?page=\$\{nextPage\}`\)/)
assert.match(answerCardListPage, /Load more cards/)

assert.match(rootLayout, /template: "%s \| VerChem"/)
for (const titlePath of [
  'app/challenge/layout.tsx',
  'app/tutorials/page.tsx',
  'app/elements/page.tsx',
  'app/elements/[symbol]/page.tsx',
  'app/solutions/layout.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/compounds/[slug]/page.tsx',
  'app/tools/page.tsx',
  'app/organic/page.tsx',
  'app/verified/[id]/page.tsx',
  'app/spectroscopy/layout.tsx',
  'app/tools/equation-balancer/layout.tsx',
  'app/tools/ph-calculator/layout.tsx',
  'app/tools/molar-mass/layout.tsx',
  'app/tools/gas-laws/layout.tsx',
  'app/tools/periodic-table/layout.tsx',
  'app/tools/stoichiometry/layout.tsx',
]) {
  assert.match(read(titlePath), /title:\s*\{\s*absolute:/, `${titlePath}: branded child title must bypass the root template`)
}

console.log('Content contract tests passed')
