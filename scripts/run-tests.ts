#!/usr/bin/env tsx

// VerChem - test runner for `npm test`
//
// Discovers every `__tests__/*.test.ts` file and runs each one in its own Node
// process, so a new test file is picked up without editing package.json. It
// keeps going after a failure and lists every failed file at the end.
//
//   npm test                 # every test file
//   npm test -- lab answer   # only files whose name contains "lab" or "answer"

import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const TEST_DIR = path.resolve(__dirname, '..', '__tests__')

// Extra Node flags for files that need them. Everything else runs with
// `node --import tsx <file>`.
const EXTRA_NODE_FLAGS: Record<string, string[]> = {
  // Imports server-only modules, which throw outside the react-server condition.
  'lab-api-contract.test.ts': ['--conditions=react-server'],
}

const filters = process.argv.slice(2).filter(arg => arg !== '--')
const files = readdirSync(TEST_DIR)
  .filter(name => name.endsWith('.test.ts'))
  .filter(name => filters.length === 0 || filters.some(filter => name.includes(filter)))
  .sort()

for (const name of Object.keys(EXTRA_NODE_FLAGS)) {
  if (!readdirSync(TEST_DIR).includes(name)) {
    console.error(`run-tests: EXTRA_NODE_FLAGS names a missing file: ${name}`)
    process.exit(1)
  }
}

if (files.length === 0) {
  console.error(`run-tests: no test files matched ${filters.length ? filters.join(', ') : '__tests__/*.test.ts'}`)
  process.exit(1)
}

const failed: string[] = []
const started = Date.now()

for (const name of files) {
  const flags = [...(EXTRA_NODE_FLAGS[name] ?? []), '--import', 'tsx']
  console.log(`\n▶ ${name}`)
  const t0 = Date.now()
  const result = spawnSync(process.execPath, [...flags, path.join(TEST_DIR, name)], {
    stdio: 'inherit',
    env: process.env,
  })
  const seconds = ((Date.now() - t0) / 1000).toFixed(1)
  if (result.status === 0) {
    console.log(`✓ ${name} (${seconds}s)`)
  } else {
    const reason = result.error ? result.error.message : result.signal ? `signal ${result.signal}` : `exit ${result.status}`
    console.log(`✗ ${name} (${seconds}s, ${reason})`)
    failed.push(name)
  }
}

const total = ((Date.now() - started) / 1000).toFixed(1)
console.log(`\n${files.length - failed.length}/${files.length} test files passed in ${total}s`)
if (failed.length > 0) {
  console.log(`Failed (${failed.length}):`)
  for (const name of failed) console.log(`  - ${name}`)
  process.exit(1)
}
