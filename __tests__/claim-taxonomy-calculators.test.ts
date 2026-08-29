/**
 * Claim-taxonomy regression checks for calculator and structure-search copy.
 *
 * Run: node --import tsx __tests__/claim-taxonomy-calculators.test.ts
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculateMolarMass } from '@/lib/data/compounds/utils'

const PROJECT_ROOT = resolve(process.cwd())

function source(relativePath: string): string {
  return readFileSync(resolve(PROJECT_ROOT, relativePath), 'utf8')
}

const calculatorSources = [
  'app/tools/molar-mass/page.tsx',
  'app/tools/molar-mass/layout.tsx',
  'app/tools/gas-laws/page.tsx',
  'app/tools/gas-laws/layout.tsx',
  'app/tools/stoichiometry/page.tsx',
  'app/tools/stoichiometry/layout.tsx',
].map(source).join('\n')

assert.doesNotMatch(calculatorSources, /Lab Ready/i)
assert.doesNotMatch(calculatorSources, /Free and accurate/i)
assert.doesNotMatch(calculatorSources, /NIST Molar Masses/i)
assert.doesNotMatch(calculatorSources, /most accurate and up-to-date/i)
assert.doesNotMatch(calculatorSources, /IUPAC-Based Atomic Weights/i)
assert.match(source('app/tools/molar-mass/page.tsx'), /IUPAC 2021/)
assert.match(source('app/tools/molar-mass/layout.tsx'), /IUPAC 2021/)
assert.match(calculatorSources, /Model-Scoped Results/)
assert.match(calculatorSources, /conventional standard atomic weights/)
assert.match(calculatorSources, /real-gas non-ideality is not modeled/)
assert.match(calculatorSources, /molar masses and stoichiometric coefficients you enter/)
assert.doesNotMatch(source('app/tools/molar-mass/page.tsx'), /6\.941|32\.065|35\.453|98\.079/)
assert.doesNotMatch(source('app/tools/stoichiometry/page.tsx'), /H2SO4': 98\.079/)
assert.equal(calculateMolarMass('H2SO4'), 98.072)

const structureSources = [
  'app/page.tsx',
  'app/tools/page.tsx',
  'app/tools/substructure-search/page.tsx',
].map(source).join('\n')

assert.doesNotMatch(structureSources, /209 verified structures/i)
assert.doesNotMatch(structureSources, /RDKit-verified/i)
assert.doesNotMatch(structureSources, /Formula-verified/i)
assert.doesNotMatch(structureSources, /NIST molecular formula/i)
assert.match(structureSources, /formula-checked structures/)
assert.match(source('app/tools/substructure-search/page.tsx'), /RDKit-parsed, formula-checked structure corpus/)
assert.match(structureSources, /formula-consistency check, not experimental structure validation/)
assert.match(source('app/page.tsx'), /Elements · IUPAC 2021 weights/)

console.log('claim-taxonomy calculator checks passed')
