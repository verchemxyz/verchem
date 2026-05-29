/**
 * VerChem W3 — LIVE smoke test against the real Claude API.
 *
 * This is the end-to-end check the unit tests cannot do: it exercises the
 * actual Anthropic tool-use loop with the production model and asserts the
 * deterministic-engine + signing invariants hold on real responses.
 *
 * NOT part of `npm test` (no network / API key in CI). Run manually:
 *
 *   ANTHROPIC_API_KEY=sk-ant-... npm run test:smoke
 *
 * Exits non-zero on any failed invariant so it can gate a deploy if desired.
 */

import { askVerified } from '@/lib/answer-cards/orchestrator'
import { verifyCardSignature, toSignablePayload } from '@/lib/answer-cards/signature'

interface Probe {
  question: string
  expectVerified: boolean
  /** optional numeric expectation: a key path in any tool result + approx value */
  expect?: { key: string; approx: number; tol: number }
}

const PROBES: Probe[] = [
  {
    question: 'What is the pH of 0.1 M HCl?',
    expectVerified: true,
    expect: { key: 'pH', approx: 1, tol: 0.05 },
  },
  {
    question: 'Balance the combustion of methane: CH4 + O2 -> CO2 + H2O',
    expectVerified: true,
  },
  {
    question: 'A gas occupies 2.0 L at 1.0 atm. What is its volume at 2.0 atm, constant temperature?',
    expectVerified: true,
    expect: { key: 'V2', approx: 1.0, tol: 0.05 },
  },
  {
    question: 'Why is benzene unusually stable compared to other unsaturated hydrocarbons?',
    expectVerified: false, // conceptual — no engine should fire
  },
]

function findNumber(card: Awaited<ReturnType<typeof askVerified>>, key: string): number | undefined {
  for (const tc of card.tool_calls) {
    if (tc.result.ok && typeof tc.result.value[key] === 'number') {
      return tc.result.value[key] as number
    }
  }
  return undefined
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY is not set. Export it and re-run:')
    console.error('    ANTHROPIC_API_KEY=sk-ant-... npm run test:smoke')
    process.exit(2)
  }

  let failed = 0
  for (const probe of PROBES) {
    process.stdout.write(`\n❓ ${probe.question}\n`)
    try {
      const card = await askVerified(probe.question)

      // Invariant 1: signature is valid against the reconstructed payload.
      const payload = toSignablePayload(card)
      const sigOk = await verifyCardSignature(payload, card.signature)
      console.log(`   status=${card.status} verified=${card.verified} tools=${card.tool_calls.length} sig=${sigOk ? 'OK' : 'BAD'}`)
      if (!sigOk) {
        console.error('   ✗ signature did not verify against its own payload')
        failed++
      }

      // Invariant 2: verified expectation
      if (probe.expectVerified && card.status !== 'verified') {
        console.error(`   ✗ expected verified, got ${card.status}`)
        failed++
      }
      if (!probe.expectVerified && card.verified) {
        console.error('   ✗ expected NOT verified (conceptual), but engine fired')
        failed++
      }

      // Invariant 3: numeric expectation
      if (probe.expect) {
        const got = findNumber(card, probe.expect.key)
        if (got === undefined) {
          console.error(`   ✗ expected a ${probe.expect.key} result, found none`)
          failed++
        } else if (Math.abs(got - probe.expect.approx) > probe.expect.tol) {
          console.error(`   ✗ ${probe.expect.key}=${got}, expected ≈${probe.expect.approx}`)
          failed++
        } else {
          console.log(`   ✓ ${probe.expect.key}=${got}`)
        }
      }

      // Invariant 4: explanation must contain no ASCII numbers that escaped the audit
      if (!card.audit.clean) {
        console.warn(`   ⚠ audit flagged unmatched figures in prose: ${card.audit.unmatched.join(', ')}`)
      }
    } catch (err) {
      console.error('   ✗ threw:', err instanceof Error ? err.message : err)
      failed++
    }
  }

  console.log(`\n${failed === 0 ? '✓ all probes passed' : `✗ ${failed} invariant(s) failed`}`)
  process.exit(failed === 0 ? 0 : 1)
}

main()
