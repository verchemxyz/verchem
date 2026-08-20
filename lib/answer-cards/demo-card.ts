import { auditExplanation } from '@/lib/answer-cards/audit'
import { TOOL_BY_NAME } from '@/lib/answer-cards/tools/registry'
import type { SignablePayload, ToolCall } from '@/lib/answer-cards/types'
import { ANSWER_CARD_SCHEMA_VERSION, buildProvenanceEnvelope } from '@/lib/answer-cards/provenance'

/**
 * The homepage hero card is a REAL artifact: the tool call runs the live
 * engine, the explanation is audited by the live auditor, and the embedded
 * audit is the auditor's verbatim output. Nothing here is hand-written trust
 * metadata — if the engine or auditor changes, this changes with it, and the
 * build fails rather than signing a claim the pipeline did not produce.
 */
export function createHomeDemoPayload(issuedAt: string): SignablePayload {
  const tool = TOOL_BY_NAME.get('calculate_molecular_mass')
  if (!tool) {
    throw new Error('Demo card requires the molecular-mass tool in the live registry')
  }

  const input = { formula: 'H2SO4' }
  const result = tool.execute(input)
  if (!result.ok) {
    throw new Error('Demo card tool call failed against the live engine')
  }

  const molarMass = (result.value as { molar_mass: number }).molar_mass
  const toolCall: ToolCall = {
    name: tool.name,
    engine: tool.engine,
    engine_version: tool.engineVersion,
    input,
    result,
    citation: tool.citation,
  }

  // Every number in the signed explanation must trace to the signed engine
  // result — the auditor enforces this, and its verdict is embedded verbatim.
  const explanation = `The molar mass of H2SO4 is ${molarMass} g/mol, computed by the deterministic molecular-mass engine from IUPAC standard atomic weights.`
  const audit = auditExplanation(explanation, [toolCall])
  if (!audit.clean) {
    throw new Error(
      `Demo card explanation failed the live auditor: unmatched ${audit.unmatched.join(', ')}`
    )
  }

  return {
    question: 'What is the molar mass of H2SO4?',
    status: 'verified',
    tool_calls: [toolCall],
    explanation,
    audit,
    model: 'verchem-static-demo',
    version: ANSWER_CARD_SCHEMA_VERSION,
    issued_at: issuedAt,
    provenance: buildProvenanceEnvelope([toolCall], 'deterministic'),
  }
}
