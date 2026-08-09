/**
 * Contracts for public credibility copy and static discoverability files.
 * These fail when dataset-derived facts drift or disallowed absolute claims
 * are reintroduced.
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { COMPOUND_STATISTICS } from '@/lib/data/compounds'

const root = process.cwd()
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')

const llms = read('public/llms.txt')
const jsonLd = read('components/seo/JsonLd.tsx')
const support = read('app/support/page.tsx')
const layout = read('app/layout.tsx')
const solutionsLayout = read('app/solutions/layout.tsx')
const solutionsPage = read('app/solutions/page.tsx')
const legacyPHRoute = read('app/tools/ph-calculator/page.tsx')
const solutionPrepPage = read('app/tools/solution-prep/page.tsx')
const compoundDetailPage = read('app/compounds/[slug]/page.tsx')
const compoundsApi = read('app/api/chemistry/compounds/route.ts')
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
  read('lib/utils/citations.ts'),
].join('\n')

const formattedCompoundCount = COMPOUND_STATISTICS.totalCompounds.toLocaleString('en-US')

assert.match(
  llms,
  new RegExp(`\\b${formattedCompoundCount.replace(',', '\\,')} Compound Records\\b`),
  'public/llms.txt compound count must match COMPOUND_STATISTICS'
)
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
assert.match(legacyPHRoute, /permanentRedirect\('\/solutions'\)/)
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

assert.doesNotMatch(
  publicCredibilityCopy,
  /\b(?:NIST|IUPAC)[ -](?:certified|validated)\b|\bcertified (?:atomic|element|compound) data\b|\bofficial NIST atomic weight values\b|\bNIST atomic masses are used\b|\b100% (?:complete|accurate)\b|\bcomplete (?:data|properties)\b|\bevery compound (?:has|includes|contains)\b|\beach compound includes\b|\bsupports all chemical compounds\b/i
)
assert.doesNotMatch(
  publicCredibilityCopy,
  /missing (?:density|equivalents?)[^\n.]{0,100}(?:assum|default)|(?:density|equivalents?)[^\n.]{0,100}(?:assum|default)(?:ed)? when missing/i
)
assert.match(llms, /missing value is rejected rather than guessed/i)

console.log('Content contract tests passed')
