/**
 * Molecule Export Utilities
 * Export molecules to various formats (SVG, SMILES, etc.)
 */

import type { BuilderAtom, BuilderBond } from '@/lib/utils/molecule-builder'
import { ATOM_COLORS } from '@/lib/data/molecules-3d'

/**
 * Export molecule as SVG string
 * @param atoms - Array of atoms
 * @param bonds - Array of bonds
 * @param width - SVG width (default: 600)
 * @param height - SVG height (default: 600)
 * @returns SVG string
 */
export function exportToSVG(
  atoms: BuilderAtom[],
  bonds: BuilderBond[],
  width: number = 600,
  height: number = 600
): string {
  if (atoms.length === 0) {
    return '<svg></svg>'
  }

  // Calculate bounding box
  const xs = atoms.map((a) => a.x)
  const ys = atoms.map((a) => a.y)
  const minX = Math.min(...xs) - 40
  const maxX = Math.max(...xs) + 40
  const minY = Math.min(...ys) - 40
  const maxY = Math.max(...ys) + 40

  // Calculate scale to fit
  const scaleX = width / (maxX - minX)
  const scaleY = height / (maxY - minY)
  const scale = Math.min(scaleX, scaleY, 1.5) // Max 1.5x zoom

  // Center offset
  const offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale
  const offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale

  // Transform coordinates
  const transform = (x: number, y: number) => ({
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  })

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`
  svg += `  <rect width="${width}" height="${height}" fill="#0f172a"/>\n`
  svg += `  <g id="molecule">\n`

  // Draw bonds first
  bonds.forEach((bond) => {
    const atom1 = atoms.find((a) => a.id === bond.atom1Id)
    const atom2 = atoms.find((a) => a.id === bond.atom2Id)
    if (!atom1 || !atom2) return

    const p1 = transform(atom1.x, atom1.y)
    const p2 = transform(atom2.x, atom2.y)

    // Calculate perpendicular offset for multiple bonds
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const angle = Math.atan2(dy, dx)
    const perpX = Math.sin(angle) * 4 * scale
    const perpY = -Math.cos(angle) * 4 * scale

    for (let i = 0; i < bond.order; i++) {
      const offset = (i - (bond.order - 1) / 2) * 6 * scale

      svg += `    <line x1="${p1.x + perpX * offset}" y1="${p1.y + perpY * offset}" x2="${p2.x + perpX * offset}" y2="${p2.y + perpY * offset}" stroke="#666666" stroke-width="${2 * scale}" stroke-linecap="round"/>\n`
    }
  })

  // Draw atoms
  atoms.forEach((atom) => {
    const p = transform(atom.x, atom.y)
    const color = ATOM_COLORS[atom.element] || '#999999'
    const radius = 20 * scale

    // Circle
    svg += `    <circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${color}" stroke="#000000" stroke-width="${1 * scale}"/>\n`

    // Element symbol
    svg += `    <text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Arial" font-size="${16 * scale}" font-weight="bold">${atom.element}</text>\n`
  })

  svg += `  </g>\n`
  svg += `</svg>`

  return svg
}

/**
 * Download SVG file
 * @param svg - SVG string
 * @param filename - Filename (default: molecule.svg)
 */
export function downloadSVG(svg: string, filename: string = 'molecule.svg'): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * Export molecule as SMILES notation
 * SMILES (Simplified Molecular Input Line Entry System)
 *
 * Note: This is a simplified implementation
 * For production, consider using a library like OpenSMILES
 *
 * @param atoms - Array of atoms
 * @param bonds - Array of bonds
 * @returns SMILES string
 */
export function exportToSMILES(
  atoms: BuilderAtom[],
  bonds: BuilderBond[]
): string {
  if (atoms.length === 0) return ''
  if (atoms.length === 1) return atoms[0].element

  // Build adjacency list
  const adj = new Map<number, Array<{ atomId: number; bondOrder: number }>>()
  atoms.forEach((atom) => adj.set(atom.id, []))

  bonds.forEach((bond) => {
    adj.get(bond.atom1Id)!.push({ atomId: bond.atom2Id, bondOrder: bond.order })
    adj.get(bond.atom2Id)!.push({ atomId: bond.atom1Id, bondOrder: bond.order })
  })

  // DFS to generate SMILES
  const visited = new Set<number>()
  const smiles: string[] = []

  function dfs(atomId: number, fromAtomId: number | null = null): void {
    visited.add(atomId)

    const atom = atoms.find((a) => a.id === atomId)!
    let symbol = atom.element

    // Handle hydrogen (usually implicit in SMILES)
    if (symbol === 'H' && adj.get(atomId)!.length === 1) {
      smiles.push('H')
      return
    }

    // Handle organic subset (C, N, O, P, S, F, Cl, Br, I)
    const organicSubset = ['C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I']
    if (!organicSubset.includes(symbol)) {
      symbol = `[${symbol}]` // Bracket notation for non-organic
    }

    smiles.push(symbol)

    const neighbors = adj.get(atomId)!
    const unvisitedNeighbors = neighbors.filter((n) => !visited.has(n.atomId))

    unvisitedNeighbors.forEach((neighbor, index) => {
      // Add bond symbol (if not single bond)
      if (neighbor.bondOrder === 2) {
        smiles.push('=')
      } else if (neighbor.bondOrder === 3) {
        smiles.push('#')
      }

      // Branch notation (for 2nd+ neighbors)
      if (index > 0) {
        smiles.push('(')
      }

      dfs(neighbor.atomId, atomId)

      if (index > 0) {
        smiles.push(')')
      }
    })

    // Handle ring closures (simplified - just detect cycles)
    neighbors
      .filter((n) => visited.has(n.atomId) && n.atomId !== fromAtomId)
      .forEach(() => {
        // Ring closure - would need proper numbering in full implementation
        smiles.push('1') // Simplified ring notation
      })
  }

  // Start DFS from first atom (or carbon if available)
  const startAtom = atoms.find((a) => a.element === 'C') || atoms[0]
  dfs(startAtom.id)

  return smiles.join('')
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Export molecule as PNG (via canvas)
 * @param atoms - Array of atoms
 * @param bonds - Array of bonds
 * @param width - Image width
 * @param height - Image height
 * @returns Data URL
 */
export function exportToPNG(
  atoms: BuilderAtom[],
  bonds: BuilderBond[],
  width: number = 600,
  height: number = 600
): string {
  // Convert SVG to data URL
  const svg = exportToSVG(atoms, bonds, width, height)
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  return URL.createObjectURL(svgBlob)
}

/**
 * Download PNG file
 * @param atoms - Array of atoms
 * @param bonds - Array of bonds
 * @param filename - Filename (default: molecule.png)
 */
export function downloadPNG(
  atoms: BuilderAtom[],
  bonds: BuilderBond[],
  filename: string = 'molecule.png'
): void {
  const svg = exportToSVG(atoms, bonds)
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 600

  const ctx = canvas.getContext('2d')!
  const img = new Image()

  img.onload = () => {
    ctx.drawImage(img, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(svg)
}

/**
 * Copy molecule as PNG image to clipboard
 * @param atoms - Array of atoms
 * @param bonds - Array of bonds
 * @returns Promise<boolean> - Success status
 */
export async function copyImageToClipboard(
  atoms: BuilderAtom[],
  bonds: BuilderBond[]
): Promise<boolean> {
  try {
    const svg = exportToSVG(atoms, bonds)
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 600

    const ctx = canvas.getContext('2d')!
    const img = new Image()

    return new Promise((resolve) => {
      img.onload = async () => {
        ctx.drawImage(img, 0, 0)

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ])
              resolve(true)
            } catch (error) {
              console.error('Failed to copy image to clipboard:', error)
              resolve(false)
            }
          } else {
            resolve(false)
          }
        })
      }

      img.onerror = () => resolve(false)
      img.src = 'data:image/svg+xml;base64,' + btoa(svg)
    })
  } catch (error) {
    console.error('Failed to copy image to clipboard:', error)
    return false
  }
}

/**
 * Export molecule as InChI (International Chemical Identifier)
 *
 * Note: This is a simplified implementation based on molecular structure
 * For production use, consider integrating with a chemistry library
 *
 * @param atoms - Array of atoms
 * @param bonds - Array of bonds
 * @returns InChI string
 */
export function exportToInChI(
  atoms: BuilderAtom[],
  bonds: BuilderBond[]
): string {
  if (atoms.length === 0) return ''

  // Build molecular formula
  const elementCounts = new Map<string, number>()
  atoms.forEach((atom) => {
    elementCounts.set(atom.element, (elementCounts.get(atom.element) || 0) + 1)
  })

  // Sort elements by Hill system (C, H, then alphabetical)
  const sortedElements = Array.from(elementCounts.entries()).sort((a, b) => {
    if (a[0] === 'C') return -1
    if (b[0] === 'C') return 1
    if (a[0] === 'H') return -1
    if (b[0] === 'H') return 1
    return a[0].localeCompare(b[0])
  })

  // Build formula string
  const formula = sortedElements
    .map(([element, count]) => `${element}${count > 1 ? count : ''}`)
    .join('')

  // Build connection layer (simplified)
  const connections: string[] = []
  bonds.forEach((bond) => {
    const atom1 = atoms.find((a) => a.id === bond.atom1Id)
    const atom2 = atoms.find((a) => a.id === bond.atom2Id)
    if (atom1 && atom2) {
      const idx1 = atoms.indexOf(atom1) + 1
      const idx2 = atoms.indexOf(atom2) + 1

      if (bond.order === 1) {
        connections.push(`${idx1}-${idx2}`)
      } else if (bond.order === 2) {
        connections.push(`${idx1}=${idx2}`)
      } else if (bond.order === 3) {
        connections.push(`${idx1}#${idx2}`)
      }
    }
  })

  // Simplified InChI format
  // Full InChI requires stereochemistry, tautomers, etc.
  const connectionLayer = connections.length > 0 ? `/c${connections.join(',')}` : ''

  return `InChI=1S/${formula}${connectionLayer}`
}

/**
 * Print molecule
 * Opens print dialog with molecule rendered
 * @param atoms - Array of atoms
 * @param bonds - Array of bonds
 * @param moleculeName - Optional molecule name to display
 */
export function printMolecule(
  atoms: BuilderAtom[],
  bonds: BuilderBond[],
  moleculeName?: string
): void {
  const svg = exportToSVG(atoms, bonds, 800, 800)

  // Create print window content
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow pop-ups to print')
    return
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Print Molecule${moleculeName ? ` - ${moleculeName}` : ''}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    h1 {
      margin-bottom: 20px;
      color: #1e293b;
    }
    .molecule-container {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }
    .info {
      margin-top: 20px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${moleculeName ? `<h1>${moleculeName}</h1>` : ''}
  <div class="molecule-container">
    ${svg}
  </div>
  <div class="info no-print">
    <p>Generated by VerChem - Chemistry Platform</p>
    <p>Atoms: ${atoms.length} | Bonds: ${bonds.length}</p>
  </div>
  <script>
    window.onload = function() {
      window.print();
      // Close window after printing (or cancel)
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
