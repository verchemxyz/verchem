import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

const vseprPage = readSource('app/vsepr/page.tsx')
const vseprViewer = readSource('components/vsepr/VSEPRViewer.tsx')
const quantum = readSource('app/tools/quantum/page.tsx')
const organicGuide = readSource('app/organic/predict/page.tsx')
const organicLanding = readSource('app/organic/page.tsx')
const organicMetadata = readSource('app/organic/layout.tsx')
const virtualLab = readSource('app/virtual-lab/page.tsx')
const titration = readSource('app/virtual-lab/titration/page.tsx')
const moleculeViewer = readSource('app/3d-viewer/page.tsx')
const llms = readSource('lib/seo/llms.ts')
const home = readSource('app/page.tsx')
const tools = readSource('app/tools/page.tsx')

assert.match(vseprPage, /Rule-based model · VSEPR theory/)
assert.match(vseprPage, /2D schematic projection/)
assert.doesNotMatch(vseprPage, /interactive 3D visualization/i)
assert.match(vseprViewer, /not a computed 3D structure or experimental geometry/)

assert.match(quantum, /symbolic shape icons/)
assert.match(quantum, /not\s+computed wavefunctions, probability-density isosurfaces, or orbital orientations/)
assert.match(quantum, /one-electron hydrogen-like ions/)
assert.match(quantum, /not a general many-electron atomic model/)
assert.doesNotMatch(quantum, /Predicts spectral lines accurately/)

assert.match(organicGuide, /Organic chemistry · Rule-based guide/)
assert.match(
  organicGuide,
  /does not evaluate a full molecular structure, stereochemistry, competing pathways, or unlisted conditions/
)
assert.match(organicGuide, /Show Transformation/)
assert.doesNotMatch(organicGuide, /Select a starting functional group and a reagent to predict the product/)
assert.match(organicLanding, /rule-based transformation/)
assert.match(organicMetadata, /rule-based transformation guide/)
assert.match(llms, /Rule-Based Transformation Guide/)
assert.match(llms, /not a computed reaction-pathway prediction/)
assert.doesNotMatch(home, /and reaction predictor/i)
assert.doesNotMatch(tools, /label: 'Reaction Predictor'/)

assert.match(virtualLab, /Model outputs are not wet-lab observations/)
assert.doesNotMatch(virtualLab, /100% Safe|Save thousands/)
assert.match(titration, /Educational deterministic/)
assert.match(titration, /not\s+measurements or experimental observations/)
assert.match(titration, /Start Simulation/)

assert.match(moleculeViewer, /curated built-in coordinate models/)
assert.match(moleculeViewer, /does not compute or validate molecular geometries/)
assert.match(moleculeViewer, /does not run\s+geometry optimization or establish experimental validity/)

console.log('Visual claim taxonomy: symbolic, rule-based, computed, and observed claims stay separated')
