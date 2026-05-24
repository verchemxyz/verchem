/**
 * VerChem AI Verified Answer Cards — Core Types
 *
 * DAY 1: Verification Core + 3 engines
 * Invariant: Every numeric claim on a card must trace to a tool_result.
 */

export interface ToolResult {
  ok: boolean
  value: Record<string, unknown>
  error?: string
}

export interface ToolCall {
  name: string
  engine: string
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

export interface AnswerCard {
  question: string
  verified: boolean
  tool_calls: ToolCall[]
  explanation: string
  model: string
  version: string
  issued_at: string
  signature: string
}

export interface SignablePayload {
  question: string
  tool_calls: Array<{
    name: string
    input: Record<string, unknown>
    result: Record<string, unknown>
  }>
  model: string
  version: string
  issued_at: string
}
