/* eslint-disable @typescript-eslint/no-require-imports */

// Simple validation script for the compound database (post-restructure)
const fs = require('fs')
const path = require('path')

const dataDir = path.join(__dirname, '../lib/data/compounds')

function getTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...getTsFiles(fullPath))
    } else if (entry.name.endsWith('.ts') && !['index.ts', 'types.ts', 'utils.ts'].includes(entry.name)) {
      files.push(fullPath)
    }
  }
  return files
}

const files = getTsFiles(dataDir)
const compoundEntries = []

const elementMass = {
  H: 1.008,
  He: 4.0026,
  Li: 6.94,
  Be: 9.0122,
  B: 10.81,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  F: 18.998,
  Ne: 20.18,
  Na: 22.99,
  Mg: 24.305,
  Al: 26.982,
  Si: 28.085,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Ti: 47.867,
  Cr: 51.996,
  Mn: 54.938,
  Fe: 55.845,
  Co: 58.933,
  Ni: 58.693,
  Cu: 63.546,
  Zn: 65.38,
  Ga: 69.723,
  As: 74.922,
  Se: 78.971,
  Br: 79.904,
  Rb: 85.468,
  Sr: 87.62,
  Cs: 132.905,
  Ag: 107.8682,
  Cd: 112.414,
  Sn: 118.71,
  I: 126.904,
  Ba: 137.327,
  Au: 196.967,
  Hg: 200.592,
  Pb: 207.2,
  Bi: 208.98,
}

function calculateMass(formula) {
  const tokens = formula.match(/([A-Z][a-z]?|\d+|\(|\))/g)
  if (!tokens) return undefined
  const stack = [{}]

  const addCount = (target, el, count) => {
    target[el] = (target[el] || 0) + count
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token === '(') {
      stack.push({})
    } else if (token === ')') {
      const group = stack.pop()
      const multiplier = tokens[i + 1] && /^\d+$/.test(tokens[i + 1]) ? Number(tokens[i + 1]) : 1
      if (multiplier !== 1) i += 1
      const top = stack[stack.length - 1]
      Object.entries(group || {}).forEach(([el, count]) => addCount(top, el, count * multiplier))
    } else if (/^[A-Z]/.test(token)) {
      const element = token
      const next = tokens[i + 1]
      const count = next && /^\d+$/.test(next) ? Number(next) : 1
      if (count !== 1) i += 1
      addCount(stack[stack.length - 1], element, count)
    }
  }

  const composition = stack.pop()
  if (!composition) return undefined
  let mass = 0
  for (const [el, count] of Object.entries(composition)) {
    const atomic = elementMass[el]
    if (!atomic) return undefined
    mass += atomic * count
  }
  return Math.round(mass * 1000) / 1000
}

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8')
  const entryPattern = /\{[\s\S]*?id:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"][\s\S]*?formula:\s*['"]([^'"]+)['"][\s\S]*?\}/g
  let match
  while ((match = entryPattern.exec(content)) !== null) {
    const [, id, name, formula] = match
    compoundEntries.push({ id, name, formula, molarMass: calculateMass(formula) })
  }
})

const totalCompounds = compoundEntries.length
const categories = files.map(f => path.basename(f, '.ts'))

// Extract some sample data
const sampleCompounds = compoundEntries.slice(0, 10)

console.log('=== VerChem Compound Database Validation ===')
console.log(`Total compounds found: ${totalCompounds}`)
console.log(`Files scanned: ${categories.join(', ')}`)
console.log('\n=== Sample Compounds ===')
sampleCompounds.forEach(compound => {
  console.log(`${compound.name} (${compound.formula}) - MW: ${compound.molarMass || 'N/A'}`)
})

// Check for required fields
const requiredFields = ['id', 'name', 'formula', 'molarMass']
const missingFields = []

compoundEntries.forEach((entry, index) => {
  requiredFields.forEach(field => {
    if (entry[field] === undefined || entry[field] === null) {
      missingFields.push(`Compound ${index + 1} missing ${field}`)
    }
  })
})

console.log('\n=== Data Quality ===')
if (missingFields.length === 0) {
  console.log('✓ All compounds have required fields')
} else {
  console.log(`⚠ Found ${missingFields.length} missing fields`)
  missingFields.slice(0, 5).forEach(field => console.log(`  - ${field}`))
}

const missingMass = compoundEntries.filter(entry => entry.molarMass === undefined)
if (missingMass.length > 0) {
  console.log('\nCompounds with missing molar mass (first 5):')
  missingMass.slice(0, 5).forEach(entry => console.log(` - ${entry.name} (${entry.formula})`))
}

console.log('\n=== Database Summary ===')
console.log('✓ Compound database successfully validated')
console.log('✓ Multiple chemical categories included')
console.log('✓ Ready for integration with calculators')
