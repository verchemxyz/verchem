/**
 * VerChem Verified Answer Cards — Tool Registry
 *
 * Single source of truth for all verified tools.
 * Anthropic SDK tool format conversion included.
 */

import type { VerifiedTool } from '../types'
import { phTools } from './ph'
import { gasTools } from './gas-laws'
import { equationTools } from './equation'

export const ALL_TOOLS: VerifiedTool[] = [...phTools, ...gasTools, ...equationTools]

export const TOOL_BY_NAME = new Map<string, VerifiedTool>()
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
