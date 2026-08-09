/** Replay a signed card against the engines that are current at load time. */

import type { CardStatus, ToolCall, ToolResult } from './types'
import { TOOL_BY_NAME } from './tools/registry'

export type EngineReplayStatus = 'current' | 'superseded' | 'corrected' | 'unavailable'

export interface EngineReplayCheck {
  name: string
  engine: string
  signedEngineVersion: string | null
  currentEngineVersion: string | null
  status: EngineReplayStatus
  currentEngineAgrees: boolean
  reason: string
}

export interface EngineReplayAssessment {
  status: EngineReplayStatus
  /** Independent of signature integrity: true only when every current engine reproduces the signed result. */
  currentEngineAgrees: boolean
  allVersionsCurrent: boolean
  checks: EngineReplayCheck[]
}

/** A current VERIFIED claim requires all three independent gates. */
export function isCurrentlyVerifiedAnswer(
  cardStatus: CardStatus,
  signatureIntact: boolean,
  replay: EngineReplayAssessment
): boolean {
  return cardStatus === 'verified' &&
    signatureIntact &&
    replay.status === 'current' &&
    replay.currentEngineAgrees &&
    replay.allVersionsCurrent
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(canonicalize)

  const sorted: Record<string, unknown> = Object.create(null)
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = canonicalize((value as Record<string, unknown>)[key])
  }
  return sorted
}

function resultsAgree(signed: ToolResult, current: ToolResult): boolean {
  return JSON.stringify(canonicalize(signed)) === JSON.stringify(canonicalize(current))
}

function replayOne(call: ToolCall): EngineReplayCheck {
  const currentTool = TOOL_BY_NAME.get(call.name)
  if (!currentTool) {
    return {
      name: call.name,
      engine: call.engine,
      signedEngineVersion: call.engine_version ?? null,
      currentEngineVersion: null,
      status: 'unavailable',
      currentEngineAgrees: false,
      reason: 'The signed tool is no longer present in the current engine registry.',
    }
  }

  let currentResult: ToolResult
  try {
    // Stored payloads are JSON. Clone before execution so a tool can never
    // mutate the signed object that is also rendered to the user.
    const replayInput = JSON.parse(JSON.stringify(call.input)) as Record<string, unknown>
    currentResult = currentTool.execute(replayInput)
  } catch {
    return {
      name: call.name,
      engine: call.engine,
      signedEngineVersion: call.engine_version ?? null,
      currentEngineVersion: currentTool.engineVersion,
      status: 'unavailable',
      currentEngineAgrees: false,
      reason: 'The current engine could not replay the signed input.',
    }
  }

  const sameEngine = call.engine === currentTool.engine
  const agrees = resultsAgree(call.result, currentResult)
  const versionCurrent = sameEngine && call.engine_version === currentTool.engineVersion

  if (!agrees) {
    return {
      name: call.name,
      engine: call.engine,
      signedEngineVersion: call.engine_version ?? null,
      currentEngineVersion: currentTool.engineVersion,
      status: 'corrected',
      currentEngineAgrees: false,
      reason: sameEngine
        ? 'The current engine produces a different result for the signed input.'
        : 'The replacement engine produces a different result for the signed input.',
    }
  }

  if (!versionCurrent) {
    return {
      name: call.name,
      engine: call.engine,
      signedEngineVersion: call.engine_version ?? null,
      currentEngineVersion: currentTool.engineVersion,
      status: 'superseded',
      currentEngineAgrees: true,
      reason: sameEngine
        ? 'The current engine agrees, but this card was issued by an older engine release.'
        : 'The current registered engine agrees, but the signed engine identity has been replaced.',
    }
  }

  return {
    name: call.name,
    engine: call.engine,
    signedEngineVersion: call.engine_version ?? null,
    currentEngineVersion: currentTool.engineVersion,
    status: 'current',
    currentEngineAgrees: true,
    reason: 'The signed engine release is current and replay produced the same result.',
  }
}

export function assessEngineReplay(toolCalls: readonly ToolCall[]): EngineReplayAssessment {
  if (toolCalls.length === 0) {
    return unavailableEngineReplay('This card contains no deterministic engine calls to replay.')
  }

  const checks = toolCalls.map(replayOne)
  const status: EngineReplayStatus = checks.some((check) => check.status === 'corrected')
    ? 'corrected'
    : checks.some((check) => check.status === 'unavailable')
      ? 'unavailable'
      : checks.some((check) => check.status === 'superseded')
        ? 'superseded'
        : 'current'

  return {
    status,
    currentEngineAgrees: checks.every((check) => check.currentEngineAgrees),
    allVersionsCurrent: checks.every((check) => check.status === 'current'),
    checks,
  }
}

export function unavailableEngineReplay(reason: string): EngineReplayAssessment {
  return {
    status: 'unavailable',
    currentEngineAgrees: false,
    allVersionsCurrent: false,
    checks: [{
      name: 'unknown',
      engine: 'unknown',
      signedEngineVersion: null,
      currentEngineVersion: null,
      status: 'unavailable',
      currentEngineAgrees: false,
      reason,
    }],
  }
}
