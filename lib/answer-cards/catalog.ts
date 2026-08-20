import { ALL_TOOLS } from './tools/registry'

export type PublicInputType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'

export interface PublicInputProperty {
  type: PublicInputType
  description: string
  enum?: Array<string | number | boolean>
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
}

export interface VerifiedToolCatalogEntry {
  name: string
  label: string
  category: string
  description: string
  engine: string
  engineVersion: string
  citation: string
  required: string[]
  properties: Record<string, PublicInputProperty>
}

function humanize(value: string): string {
  return value
    .split(/[_-]/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function categoryFor(engine: string): string {
  if (engine.includes('pH') || engine === 'dilution') return 'Solutions & pH'
  if (engine.includes('gas') || engine.includes('law')) return 'Gas laws'
  if (engine.includes('thermodynamics')) return 'Thermodynamics'
  if (engine.includes('kinetics')) return 'Kinetics'
  if (engine.includes('electrochemistry')) return 'Electrochemistry'
  if (engine.includes('nuclear')) return 'Nuclear chemistry'
  if (engine.includes('quantum')) return 'Quantum chemistry'
  if (engine.includes('concentration') || engine === 'molarity' || engine === 'molality' ||
    engine === 'mixing' || engine.includes('point') || engine === 'ppm' || engine === 'stock-prep') {
    return 'Concentration'
  }
  if (engine === 'equation-balancer') return 'Equations'
  if (engine === 'electron-configuration') return 'Atomic structure'
  return 'Stoichiometry'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function inputType(value: unknown): PublicInputType {
  return value === 'number' || value === 'integer' || value === 'boolean' ||
    value === 'array' || value === 'object'
    ? value
    : 'string'
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

export function getVerifiedToolCatalog(): VerifiedToolCatalogEntry[] {
  return ALL_TOOLS.map((tool) => {
    const schemaProperties = isRecord(tool.input_schema.properties)
      ? tool.input_schema.properties
      : {}
    const properties: Record<string, PublicInputProperty> = {}

    for (const [name, rawSchema] of Object.entries(schemaProperties)) {
      if (!isRecord(rawSchema)) continue
      const enumValues = Array.isArray(rawSchema.enum)
        ? rawSchema.enum.filter((entry): entry is string | number | boolean =>
            typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean'
          )
        : undefined
      properties[name] = {
        type: inputType(rawSchema.type),
        description: typeof rawSchema.description === 'string' ? rawSchema.description : '',
        ...(enumValues && enumValues.length > 0 ? { enum: enumValues } : {}),
        ...(finiteNumber(rawSchema.minimum) === undefined ? {} : { minimum: finiteNumber(rawSchema.minimum) }),
        ...(finiteNumber(rawSchema.maximum) === undefined ? {} : { maximum: finiteNumber(rawSchema.maximum) }),
        ...(finiteNumber(rawSchema.exclusiveMinimum) === undefined ? {} : { exclusiveMinimum: finiteNumber(rawSchema.exclusiveMinimum) }),
        ...(finiteNumber(rawSchema.exclusiveMaximum) === undefined ? {} : { exclusiveMaximum: finiteNumber(rawSchema.exclusiveMaximum) }),
      }
    }

    const required = Array.isArray(tool.input_schema.required)
      ? tool.input_schema.required.filter((name): name is string => typeof name === 'string')
      : []

    return {
      name: tool.name,
      label: humanize(tool.name),
      category: categoryFor(tool.engine),
      description: tool.description,
      engine: tool.engine,
      engineVersion: tool.engineVersion,
      citation: tool.citation,
      required,
      properties,
    }
  }).sort((left, right) =>
    left.category.localeCompare(right.category) || left.label.localeCompare(right.label)
  )
}
