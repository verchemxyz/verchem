import 'client-only'

import type { RDKitModule } from './types'

let rdkitInstance: RDKitModule | null = null
let loadPromise: Promise<RDKitModule> | null = null

/**
 * Lazy-load RDKit WASM module (singleton).
 * Safe to call multiple times — returns the same promise.
 *
 * The WASM file is served from /public/rdkit/RDKit_minimal.wasm
 * and located via the `locateFile` callback.
 */
export async function loadRDKit(): Promise<RDKitModule> {
  if (rdkitInstance) return rdkitInstance

  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      // RDKit_minimal.js is a CJS module that exports initRDKitModule directly.
      // In ESM contexts we access it via .default.
      const rdkitModule = await import('@rdkit/rdkit')
      const initRDKitModule = rdkitModule.default as (opts?: { locateFile?: () => string }) => Promise<RDKitModule>
      const instance = await initRDKitModule({
        locateFile: () => '/rdkit/RDKit_minimal.wasm',
      })
      rdkitInstance = instance
      return instance
    } catch (err) {
      // Clear loadPromise so the next call can retry (e.g. after a network
      // hiccup or a corrected WASM path).
      loadPromise = null
      throw err
    }
  })()

  return loadPromise
}

/** Returns true if the RDKit WASM module has already been loaded. */
export function isRDKitLoaded(): boolean {
  return rdkitInstance !== null
}
