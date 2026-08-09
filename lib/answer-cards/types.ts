/**
 * VerChem AI Verified Answer Cards — Core Types
 *
 * DAY 1 (W3-R2): Status enum + numeric audit + full signature coverage
 */

import type { EngineSemanticVersion } from './engine-versions'

export type CardStatus = 'verified' | 'partial' | 'unverified' | 'error'

export interface ToolResult {
  ok: boolean
  value: Record<string, unknown>
  error?: string
}

export interface ToolCall {
  name: string
  engine: string
  /** Missing only on legacy w3-v1 cards issued before replay-aware payloads. */
  engine_version?: EngineSemanticVersion
  input: Record<string, unknown>
  result: ToolResult
  citation: string
}

export interface VerifiedTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
  citation: string
  engine: string
  execute: (input: Record<string, unknown>) => ToolResult
}

export interface VersionedVerifiedTool extends VerifiedTool {
  engineVersion: EngineSemanticVersion
}

export interface AnswerCard {
  question: string
  status: CardStatus
  /** @deprecated kept for compat — use status instead */
  verified: boolean
  tool_calls: ToolCall[]
  explanation: string
  audit: { clean: boolean; unmatched: string[] }
  model: string
  version: string
  issued_at: string
  signature: string
}

export interface SignablePayload {
  question: string
  status: CardStatus
  tool_calls: Array<{
    name: string
    engine: string
    /** Missing only on legacy w3-v1 cards. */
    engine_version?: EngineSemanticVersion
    input: Record<string, unknown>
    result: { ok: boolean; value: Record<string, unknown>; error?: string }
    citation: string
  }>
  explanation: string
  audit: { clean: boolean; unmatched: string[] }
  model: string
  version: string
  issued_at: string
}
