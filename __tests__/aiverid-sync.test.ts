/**
 * Identity Standard v2.2 Part C.4 regression contracts.
 *
 * Guards both fresh installs and the existing-database upgrade path, plus the
 * privacy invariant that public molecule/card queries never read owner ids.
 */

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

type TestFn = () => void
interface TestCase { name: string; fn: TestFn }

const tests: TestCase[] = []
const STANDARD_COLUMN = 'aiverid'
const LEGACY_COLUMN = [STANDARD_COLUMN, 'id'].join('_')
const MIGRATION_003 = 'supabase/migrations/003_rename_aiverid.sql'

function test(name: string, fn: TestFn) {
  tests.push({ name, fn })
}

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1
}

function sourceFilesUnder(path: string): string[] {
  const acceptedExtensions = new Set(['.ts', '.tsx', '.js', '.sql', '.json', '.md'])
  const files: string[] = []

  function visit(absolutePath: string) {
    for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
      const entryPath = join(absolutePath, entry.name)
      if (entry.isDirectory()) visit(entryPath)
      else if (acceptedExtensions.has(extname(entry.name))) files.push(entryPath)
    }
  }

  visit(join(process.cwd(), path))
  return files
}

function selectedColumns(functionSource: string, functionName: string): string[] {
  const start = functionSource.indexOf(`function ${functionName}`)
  assert.notEqual(start, -1, `${functionName} must exist`)
  const nextExport = functionSource.indexOf('\nexport ', start + 1)
  const block = functionSource.slice(start, nextExport === -1 ? undefined : nextExport)
  const match = block.match(/\.select\('([^']+)'\)/)
  assert.ok(match, `${functionName} must use an explicit Supabase select list`)
  return match[1].split(',').map((column) => column.trim())
}

test('fresh migrations 000-002 define only the standard aiverid TEXT column', () => {
  for (const path of [
    'supabase/migrations/000_users_table.sql',
    'supabase/migrations/001_molecules_table.sql',
    'supabase/migrations/002_answer_cards_table.sql',
  ]) {
    const sql = source(path)
    assert.match(sql, new RegExp(`\\b${STANDARD_COLUMN}\\s+TEXT\\b`), path)
    assert.equal(sql.includes(LEGACY_COLUMN), false, `${path} must not retain the legacy name`)
  }

  const fullSetup = source('supabase/full_setup.sql')
  assert.equal(
    countOccurrences(fullSetup, `${STANDARD_COLUMN} TEXT`),
    3,
    'full_setup must define the standard column once per table'
  )
  assert.equal(fullSetup.includes(LEGACY_COLUMN), false)
})

test('migration 003 conditionally renames all three columns and legacy index names', () => {
  const sql = source(MIGRATION_003)
  assert.equal(countOccurrences(sql, 'FROM information_schema.columns'), 6)
  // 3 column renames + 1 dashboard-era users UNIQUE-constraint rename.
  assert.equal(countOccurrences(sql, ') AND NOT EXISTS ('), 4)
  assert.ok(
    sql.includes(
      `ALTER TABLE public.users RENAME CONSTRAINT users_${LEGACY_COLUMN}_key TO users_${STANDARD_COLUMN}_key;`
    ),
    'legacy users unique-constraint rename must be present'
  )

  for (const table of ['users', 'molecules', 'answer_cards']) {
    assert.ok(
      sql.includes(
        `ALTER TABLE public.${table} RENAME COLUMN ${LEGACY_COLUMN} TO ${STANDARD_COLUMN};`
      ),
      `${table} column rename must be present`
    )

    const legacyIndex = `idx_${table}_${LEGACY_COLUMN}`
    const standardIndex = `idx_${table}_${STANDARD_COLUMN}`
    assert.ok(sql.includes(`to_regclass('public.${legacyIndex}') IS NOT NULL`))
    assert.ok(sql.includes(`to_regclass('public.${standardIndex}') IS NULL`))
    assert.ok(sql.includes(`ALTER INDEX public.${legacyIndex} RENAME TO ${standardIndex};`))
  }
})

test('runtime/schema sources contain no legacy member-id name outside migration 003', () => {
  const files = ['app', 'lib', '__tests__', 'supabase']
    .flatMap(sourceFilesUnder)
    .filter((path) => relative(process.cwd(), path) !== MIGRATION_003)
  const offenders = files
    .filter((path) => readFileSync(path, 'utf8').includes(LEGACY_COLUMN))
    .map((path) => relative(process.cwd(), path))

  assert.deepEqual(offenders, [])
})

test('public molecule and answer-card selects omit the owner identifier', () => {
  const moleculeColumns = selectedColumns(
    source('lib/supabase/molecules.ts'),
    'getPublicMoleculeById'
  )
  const answerCardColumns = selectedColumns(
    source('lib/supabase/answer-cards.ts'),
    'getPublicAnswerCardById'
  )

  assert.equal(moleculeColumns.includes(STANDARD_COLUMN), false)
  assert.equal(answerCardColumns.includes(STANDARD_COLUMN), false)
})

function runTests() {
  let passed = 0
  let failed = 0

  for (const { name, fn } of tests) {
    try {
      fn()
      passed++
      console.log(`  ✅ ${name}`)
    } catch (error) {
      failed++
      console.error(`  ❌ ${name}`)
      console.error('    ', error instanceof Error ? error.message : error)
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

console.log('AIVerID Sync Tests')
runTests()
