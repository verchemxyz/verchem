'use client'

// VerChem - Interactive Periodic Table Grid Component

import type { Element } from '@/lib/types/chemistry'
import { PERIODIC_TABLE } from '@/lib/data/periodic-table'

interface PeriodicTableGridProps {
  onElementClick: (element: Element) => void
  highlightCategory?: string | null
  searchQuery?: string
}

// Category colors using CSS variables for theme support
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'alkali-metal': { 
    bg: 'bg-element-alkali/20', 
    border: 'border-element-alkali', 
    text: 'text-element-alkali dark:text-element-alkali/90' 
  },
  'alkaline-earth-metal': { 
    bg: 'bg-element-alkaline/20', 
    border: 'border-element-alkaline', 
    text: 'text-element-alkaline dark:text-element-alkaline/90' 
  },
  'transition-metal': { 
    bg: 'bg-element-transition/20', 
    border: 'border-element-transition', 
    text: 'text-element-transition dark:text-element-transition/90' 
  },
  'post-transition-metal': { 
    bg: 'bg-element-metals/20', 
    border: 'border-element-metals', 
    text: 'text-element-metals dark:text-element-metals/90' 
  },
  'metalloid': { 
    bg: 'bg-element-metalloids/20', 
    border: 'border-element-metalloids', 
    text: 'text-element-metalloids dark:text-element-metalloids/90' 
  },
  'nonmetal': { 
    bg: 'bg-element-nonmetals/20', 
    border: 'border-element-nonmetals', 
    text: 'text-element-nonmetals dark:text-element-nonmetals/90' 
  },
  'halogen': { 
    bg: 'bg-element-halogens/20', 
    border: 'border-element-halogens', 
    text: 'text-element-halogens dark:text-element-halogens/90' 
  },
  'noble-gas': { 
    bg: 'bg-element-noble-gases/20', 
    border: 'border-element-noble-gases', 
    text: 'text-element-noble-gases dark:text-element-noble-gases/90' 
  },
  'lanthanide': { 
    bg: 'bg-element-lanthanides/20', 
    border: 'border-element-lanthanides', 
    text: 'text-element-lanthanides dark:text-element-lanthanides/90' 
  },
  'actinide': { 
    bg: 'bg-element-actinides/20', 
    border: 'border-element-actinides', 
    text: 'text-element-actinides dark:text-element-actinides/90' 
  },
  'unknown': { 
    bg: 'bg-muted', 
    border: 'border-border', 
    text: 'text-muted-foreground' 
  },
}

// Helper function to get element position in grid
function getElementPosition(element: Element): { row: number; col: number } {
  const period = element.period
  const group = element.group

  // Row is simply period - 1
  const row = period - 1

  // Column logic based on group
  let col = 0

  if (group === undefined) {
    // Lanthanides and Actinides - don't show in main grid
    return { row: -1, col: -1 }
  }

  // Standard group to column mapping
  // Groups 1-2: columns 0-1
  // Groups 3-12: columns 2-11 (transition metals)
  // Groups 13-18: columns 12-17
  col = group - 1

  return { row, col }
}

export default function PeriodicTableGrid({
  onElementClick,
  highlightCategory = null,
  searchQuery = '',
}: PeriodicTableGridProps) {
  // Create 2D grid (18 columns × 7 rows for periods 1-7)
  const grid: (Element | null)[][] = Array(7)
    .fill(null)
    .map(() => Array(18).fill(null))

  // Place elements in grid
  PERIODIC_TABLE.forEach((element) => {
    const { row, col } = getElementPosition(element)

    if (row >= 0 && row < 7 && col >= 0 && col < 18) {
      grid[row][col] = element
    }
  })

  // Filter elements based on search
  const matchesSearch = (element: Element | null) => {
    if (!element || !searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      element.name.toLowerCase().includes(query) ||
      element.symbol.toLowerCase().includes(query) ||
      element.atomicNumber.toString().includes(query)
    )
  }

  return (
    <div className="relative">
      {/* Main grid */}
      <div className="grid grid-cols-18 gap-0.5 mb-4">
        {grid.map((row, rowIndex) =>
          row.map((element, colIndex) => {
            if (!element) {
              // Empty cell
              return (
                <div
                  key={`empty-${rowIndex}-${colIndex}`}
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
                />
              )
            }

            const colors = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown
            const isHighlighted = highlightCategory
              ? element.category === highlightCategory
              : true
            const matchesFilter = matchesSearch(element)
            const opacity = isHighlighted && matchesFilter ? 'opacity-100' : 'opacity-30'

            return (
              <button
                key={element.atomicNumber}
                onClick={() => onElementClick(element)}
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                  ${colors.bg} ${colors.border} ${colors.text}
                  border-2 rounded
                  hover:scale-110 hover:z-10 hover:shadow-lg
                  transition-all duration-200
                  ${opacity}
                  flex flex-col items-center justify-center
                  cursor-pointer
                  group
                `}
                title={element.name}
              >
                <div className="text-[8px] sm:text-[9px] md:text-[10px] font-medium">
                  {element.atomicNumber}
                </div>
                <div className="text-xs sm:text-sm md:text-base font-bold">
                  {element.symbol}
                </div>
                <div className="hidden md:block text-[8px] truncate w-full text-center">
                  {element.atomicMass.toFixed(0)}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Lanthanides and Actinides - Separate rows */}
      <div className="mt-4 space-y-2">
        {/* Lanthanides */}
        <div className="flex gap-0.5 items-center">
          <div className="w-24 text-xs font-medium text-muted-foreground mr-2">
            Lanthanides
          </div>
          {PERIODIC_TABLE.filter((el) => el.category === 'lanthanide')
            .sort((a, b) => a.atomicNumber - b.atomicNumber)
            .map((element) => {
              const colors = CATEGORY_COLORS.lanthanide
              const isHighlighted = highlightCategory
                ? element.category === highlightCategory
                : true
              const matchesFilter = matchesSearch(element)
              const opacity = isHighlighted && matchesFilter ? 'opacity-100' : 'opacity-30'

              return (
                <button
                  key={element.atomicNumber}
                  onClick={() => onElementClick(element)}
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                    ${colors.bg} ${colors.border} ${colors.text}
                    border-2 rounded
                    hover:scale-110 hover:z-10 hover:shadow-lg
                    transition-all duration-200
                    ${opacity}
                    flex flex-col items-center justify-center
                    cursor-pointer
                  `}
                  title={element.name}
                >
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] font-medium">
                    {element.atomicNumber}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-bold">
                    {element.symbol}
                  </div>
                </button>
              )
            })}
        </div>

        {/* Actinides */}
        <div className="flex gap-0.5 items-center">
          <div className="w-24 text-xs font-medium text-muted-foreground mr-2">
            Actinides
          </div>
          {PERIODIC_TABLE.filter((el) => el.category === 'actinide')
            .sort((a, b) => a.atomicNumber - b.atomicNumber)
            .map((element) => {
              const colors = CATEGORY_COLORS.actinide
              const isHighlighted = highlightCategory
                ? element.category === highlightCategory
                : true
              const matchesFilter = matchesSearch(element)
              const opacity = isHighlighted && matchesFilter ? 'opacity-100' : 'opacity-30'

              return (
                <button
                  key={element.atomicNumber}
                  onClick={() => onElementClick(element)}
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16
                    ${colors.bg} ${colors.border} ${colors.text}
                    border-2 rounded
                    hover:scale-110 hover:z-10 hover:shadow-lg
                    transition-all duration-200
                    ${opacity}
                    flex flex-col items-center justify-center
                    cursor-pointer
                  `}
                  title={element.name}
                >
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] font-medium">
                    {element.atomicNumber}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-bold">
                    {element.symbol}
                  </div>
                </button>
              )
            })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-11 gap-2 text-xs">
        {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 ${colors.bg} ${colors.border} border-2 rounded`}
            />
            <span className="capitalize text-foreground">
              {category.replace(/-/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}