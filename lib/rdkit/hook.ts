'use client'

import { useState, useEffect } from 'react'
import { loadRDKit } from './client'
import type { RDKitModule } from './types'

export interface UseRDKitState {
  rdkit: RDKitModule | null
  isLoading: boolean
  error: Error | null
}

/**
 * React hook that loads the RDKit WASM module on mount.
 *
 * Usage:
 *   const { rdkit, isLoading, error } = useRDKit()
 *   if (isLoading) return <Spinner />
 *   if (error) return <ErrorMessage error={error} />
 *   // use rdkit...
 */
export function useRDKit(): UseRDKitState {
  const [state, setState] = useState<UseRDKitState>({
    rdkit: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    loadRDKit()
      .then((rdkit) => {
        if (!cancelled) setState({ rdkit, isLoading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            rdkit: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error('RDKit load failed'),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
