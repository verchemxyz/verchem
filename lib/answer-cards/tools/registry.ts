/**
 * VerChem Verified Answer Cards — Tool Registry
 *
 * Single source of truth for all verified tools.
 * Anthropic SDK tool format conversion included.
 */

import type { VerifiedTool, VersionedVerifiedTool } from '../types'
import { getCurrentEngineVersion } from '../engine-versions'
import { phTools } from './ph'
import { gasTools } from './gas-laws'
import { equationTools } from './equation'
import { stoichiometryTools } from './stoichiometry'
import { concentrationTools } from './concentration'
import { thermodynamicsTools } from './thermodynamics'
import { kineticsTools } from './kinetics'
import { electrochemistryTools } from './electrochemistry'
import { nuclearTools } from './nuclear'
import { quantumTools } from './quantum'
import { electronConfigTools } from './electron-config'
import { labPrepTools } from './lab-prep'

const TOOL_DEFINITIONS: VerifiedTool[] = [
  ...phTools,
  ...gasTools,
  ...equationTools,
  ...stoichiometryTools,
  ...concentrationTools,
  ...thermodynamicsTools,
  ...kineticsTools,
  ...electrochemistryTools,
  ...nuclearTools,
  ...quantumTools,
  ...electronConfigTools,
  ...labPrepTools,
]

export const ALL_TOOLS: VersionedVerifiedTool[] = TOOL_DEFINITIONS.map((tool) => {
  const engineVersion = getCurrentEngineVersion(tool.engine)
  if (!engineVersion) {
    throw new Error(`Missing semantic version for answer-card engine "${tool.engine}"`)
  }
  return { ...tool, engineVersion }
})

export const TOOL_BY_NAME = new Map<string, VersionedVerifiedTool>()
for (const tool of ALL_TOOLS) {
  TOOL_BY_NAME.set(tool.name, tool)
}

/**
 * Convert a VerifiedTool to Anthropic SDK tool format.
 */
export function toAnthropicTool(tool: VerifiedTool): {
  name: string
  description: string
  input_schema: { type: 'object'; properties?: unknown; required?: Array<string> | null; [k: string]: unknown }
} {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema as { type: 'object'; properties?: unknown; required?: Array<string> | null; [k: string]: unknown },
  }
}
