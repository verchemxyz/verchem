import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const PROJECT_ROOT = resolve(process.cwd())
const SCAN_ROOTS = ['app', 'components', 'lib/seo']

const BANNED_UNQUALIFIED_CLAIMS = [
  { label: 'research-grade', pattern: /\bresearch-grade\b/i },
  { label: 'scientifically validated', pattern: /\bscientifically validated\b/i },
  { label: 'Lab Ready', pattern: /\bLab Ready\b/i },
  { label: 'verified structure corpus', pattern: /\b(?:209\s+)?verified structures?\b/i },
  { label: 'RDKit-verified', pattern: /\bRDKit-verified\b/i },
  { label: 'blanket scientific accuracy', pattern: /\ball data is scientifically accurate\b/i },
  { label: 'absolute virtual-lab safety', pattern: /\b100% Safe\b/i },
  { label: 'overbroad quantum calculator', pattern: /\bQuantum Chemistry Calculator\b/i },
  { label: 'overbroad reaction predictor', pattern: /\bReaction Predictor\b/i },
] as const

function collectSourceFiles(directory: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) files.push(...collectSourceFiles(path))
    else if (/\.(?:ts|tsx)$/.test(entry)) files.push(path)
  }
  return files
}

const violations: string[] = []
for (const root of SCAN_ROOTS) {
  for (const file of collectSourceFiles(resolve(PROJECT_ROOT, root))) {
    const source = readFileSync(file, 'utf8')
    for (const claim of BANNED_UNQUALIFIED_CLAIMS) {
      if (claim.pattern.test(source)) {
        violations.push(`${relative(PROJECT_ROOT, file)}: ${claim.label}`)
      }
    }
  }
}

assert.deepEqual(violations, [], `Unqualified scientific claims found:\n${violations.join('\n')}`)

console.log('Scientific claim lint passed')
