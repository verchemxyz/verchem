import type { AnswerCard, VerifiedTool } from './types'
import type { LabRecordEnvelope } from '@/lib/lab/types'
import { TOOL_BY_NAME } from './tools/registry'
import { signCard, toSignablePayload } from './signature'
import { ANSWER_CARD_SCHEMA_VERSION, buildProvenanceEnvelope } from './provenance'

type DirectCalculationErrorCode =
  | 'unknown_tool'
  | 'invalid_input'
  | 'calculation_failed'

export class DirectCalculationError extends Error {
  readonly code: DirectCalculationErrorCode
  readonly httpStatus: number

  constructor(code: DirectCalculationErrorCode, message: string, httpStatus: number) {
    super(message)
    this.name = 'DirectCalculationError'
    this.code = code
    this.httpStatus = httpStatus
  }
}

const MAX_DEPTH = 8
const MAX_KEYS = 128
const MAX_ARRAY_LENGTH = 512
const MAX_STRING_LENGTH = 4_000
const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSafeJsonValue(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return false
  if (value === null || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'string') return value.length <= MAX_STRING_LENGTH
  if (Array.isArray(value)) {
    return value.length <= MAX_ARRAY_LENGTH &&
      value.every((entry) => isSafeJsonValue(entry, depth + 1))
  }
  if (isPlainObject(value)) {
    const keys = Object.keys(value)
    return keys.length <= MAX_KEYS && keys.every((key) =>
      !POISON_KEYS.has(key) && isSafeJsonValue(value[key], depth + 1)
    )
  }
  return false
}

function schemaProperties(tool: VerifiedTool): Record<string, Record<string, unknown>> {
  const rawProperties = tool.input_schema.properties
  if (!isPlainObject(rawProperties)) return {}

  const properties: Record<string, Record<string, unknown>> = {}
  for (const [name, schema] of Object.entries(rawProperties)) {
    if (isPlainObject(schema)) properties[name] = schema
  }
  return properties
}

function schemaRequired(tool: VerifiedTool): Set<string> {
  return new Set(
    Array.isArray(tool.input_schema.required)
      ? tool.input_schema.required.filter((name): name is string => typeof name === 'string')
      : []
  )
}

function valueMatchesSchema(value: unknown, schema: Record<string, unknown>): boolean {
  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => candidate === value)) {
    return false
  }

  switch (schema.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'integer':
      return typeof value === 'number' && Number.isSafeInteger(value)
    case 'string':
      return typeof value === 'string'
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return isPlainObject(value)
    default:
      return true
  }
}

export function validateDirectCalculationInput(
  tool: VerifiedTool,
  input: unknown
): Record<string, unknown> {
  if (!isPlainObject(input) || !isSafeJsonValue(input)) {
    throw new DirectCalculationError(
      'invalid_input',
      'input must be a bounded JSON object containing only finite values',
      400
    )
  }

  const properties = schemaProperties(tool)
  const allowed = new Set(Object.keys(properties))
  const unknownKeys = Object.keys(input).filter((key) => !allowed.has(key))
  if (unknownKeys.length > 0) {
    throw new DirectCalculationError(
      'invalid_input',
      `Unknown input field${unknownKeys.length === 1 ? '' : 's'}: ${unknownKeys.join(', ')}`,
      400
    )
  }

  const missing = [...schemaRequired(tool)].filter((key) => !(key in input))
  if (missing.length > 0) {
    throw new DirectCalculationError(
      'invalid_input',
      `Missing required field${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}`,
      400
    )
  }

  for (const [key, value] of Object.entries(input)) {
    const propertySchema = properties[key]
    if (propertySchema && !valueMatchesSchema(value, propertySchema)) {
      throw new DirectCalculationError(
        'invalid_input',
        `${key} does not match the declared ${String(propertySchema.type ?? 'input')} schema`,
        400
      )
    }
  }

  return JSON.parse(JSON.stringify(input)) as Record<string, unknown>
}

function readableToolName(name: string): string {
  return name
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export interface DeterministicCardOptions {
  issuedAt?: string
  question?: string
  labRecord?: LabRecordEnvelope
}

/** Build the unsigned deterministic payload shared by direct cards and Lab-QC packs. */
export function buildDeterministicAnswerCard(
  toolName: string,
  rawInput: unknown,
  options: DeterministicCardOptions = {}
): Omit<AnswerCard, 'signature'> {
  const tool = TOOL_BY_NAME.get(toolName)
  if (!tool) {
    throw new DirectCalculationError('unknown_tool', 'Unknown deterministic engine tool', 404)
  }

  const input = validateDirectCalculationInput(tool, rawInput)
  const result = tool.execute(input)
  if (!result.ok) {
    throw new DirectCalculationError(
      'calculation_failed',
      result.error ?? 'The deterministic engine rejected this input',
      422
    )
  }

  const toolCall = {
    name: tool.name,
    engine: tool.engine,
    engine_version: tool.engineVersion,
    input,
    result,
    citation: tool.citation,
  }
  return {
    question: options.question ?? `Verified calculation: ${readableToolName(tool.name)}`,
    status: 'verified',
    verified: true,
    tool_calls: [toolCall],
    explanation: 'This artifact contains a deterministic engine result. No AI narrative was requested or used.',
    audit: { clean: true, unmatched: [] },
    model: 'verchem-deterministic',
    version: ANSWER_CARD_SCHEMA_VERSION,
    issued_at: options.issuedAt ?? new Date().toISOString(),
    provenance: buildProvenanceEnvelope([toolCall], 'deterministic'),
    ...(options.labRecord === undefined ? {} : { lab_record: options.labRecord }),
  }
}

export async function createDeterministicAnswerCard(
  toolName: string,
  rawInput: unknown,
  issuedAt = new Date().toISOString()
): Promise<AnswerCard> {
  const card = buildDeterministicAnswerCard(toolName, rawInput, { issuedAt })
  return { ...card, signature: await signCard(toSignablePayload(card)) }
}
