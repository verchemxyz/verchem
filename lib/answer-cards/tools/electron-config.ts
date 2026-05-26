/**
 * VerChem Verified Answer Cards — Electron Configuration Tool Adapters
 *
 * Maps Claude tool calls to deterministic engines in lib/calculations/electron-config.ts
 * CRITICAL: execute() routes to engine functions directly — no formula reimplementation.
 */

import type { VerifiedTool, ToolResult } from '../types'
import { readFiniteNumber, finalizeResult } from './_validate'
import { calculateElectronConfiguration } from '@/lib/calculations/electron-config'
import { getElementByAtomicNumber } from '@/lib/data/periodic-table'

const CITATION = 'Brown, LeMay & Bursten, Chemistry: The Central Science (15th ed.), Ch. 6 (Electronic Structure of Atoms)'

function err(message: string): ToolResult {
  return { ok: false, value: {}, error: message }
}

function readAtomicNumber(value: unknown): number | undefined {
  const n = readFiniteNumber(value)
  if (n === undefined || !Number.isInteger(n) || n < 1 || n > 118) {
    return undefined
  }
  return n
}

const electron_configuration: VerifiedTool = {
  name: 'electron_configuration',
  description: 'Calculate the electron configuration for an element from atomic number. Use when the user asks for full, noble-gas, or condensed electron configuration.',
  input_schema: {
    type: 'object',
    properties: {
      atomicNumber: { type: 'integer', description: 'Atomic number, 1 to 118' },
      apply_exceptions: { type: 'boolean', description: 'Apply known Aufbau exceptions. Default: true' },
    },
    required: ['atomicNumber'],
  },
  citation: CITATION,
  engine: 'electron-configuration',
  execute: (input) => {
    const atomicNumber = readAtomicNumber(input.atomicNumber)
    if (atomicNumber === undefined) return err('atomicNumber must be an integer from 1 to 118')
    if (input.apply_exceptions !== undefined && typeof input.apply_exceptions !== 'boolean') {
      return err('apply_exceptions must be a boolean if provided')
    }

    try {
      const element = getElementByAtomicNumber(atomicNumber)
      if (!element) return err('No element found for atomicNumber')
      const result = calculateElectronConfiguration(atomicNumber, element.symbol, input.apply_exceptions !== false)
      return finalizeResult({
        atomicNumber: result.atomicNumber,
        element: result.element,
        fullConfig: result.fullConfig,
        nobleGasConfig: result.nobleGasConfig,
        condensedConfig: result.condensedConfig,
        valenceElectrons: result.valenceElectrons,
      })
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Electron configuration calculation failed')
    }
  },
}

export const electronConfigTools: VerifiedTool[] = [electron_configuration]
