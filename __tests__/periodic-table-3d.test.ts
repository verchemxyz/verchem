import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseElectronStructure } from '@/lib/chemistry/electron-configuration'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'

const models = PERIODIC_TABLE.map((element) => ({
  element,
  structure: parseElectronStructure(element),
}))

assert.equal(PERIODIC_TABLE.length, 118, 'the 3D visual must cover all 118 elements')

for (const { element, structure } of models) {
  assert.equal(
    structure.totalElectrons,
    element.atomicNumber,
    `${element.symbol} shell markers must total its atomic number`
  )
  assert.ok(structure.shells.length >= 1 && structure.shells.length <= 7)
  assert.ok(structure.subshells.every((subshell) => subshell.electrons <= subshell.capacity))
}

const modelFor = (symbol: string) => {
  const match = models.find(({ element }) => element.symbol === symbol)
  assert.ok(match, `missing ${symbol}`)
  return match
}

assert.deepEqual(modelFor('K').structure.shells, [2, 8, 8, 1])
assert.deepEqual(modelFor('Cr').structure.shells, [2, 8, 13, 1])
assert.deepEqual(modelFor('Cu').structure.shells, [2, 8, 18, 1])
assert.deepEqual(modelFor('Pd').structure.shells, [2, 8, 18, 18])
assert.deepEqual(modelFor('Lr').structure.shells, [2, 8, 18, 32, 32, 8, 3])
assert.deepEqual(modelFor('Og').structure.shells, [2, 8, 18, 32, 32, 18, 8])
assert.equal(modelFor('Lr').element.electronConfiguration, '[Rn] 5f¹⁴ 7s² 7p¹')

assert.equal(models.filter(({ structure }) => structure.isPredicted).length, 10)
assert.ok(models.filter(({ structure }) => structure.isPredicted).every(({ element }) => element.atomicNumber > 108))

const structurePreview = readFileSync(
  resolve(process.cwd(), 'components/periodic-table/ElementStructurePreview.tsx'),
  'utf8'
)
assert.doesNotMatch(structurePreview, /Tetrahedral network|Octahedral coordination|Metallic lattice/)
assert.match(structurePreview, /Predicted ground state/)

console.log('Periodic table 3D integrity: 118/118 electron configurations verified')
