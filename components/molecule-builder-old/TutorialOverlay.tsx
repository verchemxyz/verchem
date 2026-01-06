'use client'

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Tutorial step definition
 */
interface TutorialStep {
  title: string
  description: string
  target?: string // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * Tutorial steps for the molecule builder
 */
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Molecule Builder! 🧪',
    description:
      'Build molecules with real-time validation and instant stability feedback. This quick tutorial will show you the basics.',
  },
  {
    title: 'The Canvas',
    description:
      'Click anywhere on the canvas to place an atom. The canvas shows a grid to help you position atoms precisely.',
    target: '[data-tutorial="builder-canvas"]',
    position: 'bottom',
  },
  {
    title: 'Atom Palette',
    description:
      'Select elements from the palette. Each element shows its valence electrons and maximum bond capacity. Invalid bond types are automatically blocked.',
    target: '[data-tutorial="atom-palette"]',
    position: 'left',
  },
  {
    title: 'Creating Bonds',
    description:
      'Drag from one atom to another to create a bond. Drag again to upgrade from single → double → triple bonds (when allowed).',
    target: '[data-tutorial="builder-canvas"]',
    position: 'bottom',
  },
  {
    title: 'Load Presets',
    description:
      'Choose from 26 pre-built molecules! Use categories and search to find molecules quickly. Each preset includes complete 3D coordinates.',
    target: '[data-tutorial="preset-selector"]',
    position: 'top',
  },
  {
    title: 'Stability Panel',
    description:
      'Real-time validation shows which atoms are stable, formal charges, and helpful hints to fix any issues.',
    target: '[data-tutorial="stability-panel"]',
    position: 'left',
  },
  {
    title: 'Keyboard Shortcuts',
    description:
      'Use keyboard shortcuts for faster building:\n• Ctrl+Z / Cmd+Z - Undo\n• Ctrl+Y / Cmd+Y - Redo\n• Shift+Click - Multi-select atoms\n• Delete - Remove selection\n• Ctrl+A - Select all',
    target: '[data-tutorial="builder-canvas"]',
    position: 'bottom',
  },
  {
    title: "You're Ready! 🎉",
    description:
      'Start building! Try creating water (H₂O), methane (CH₄), or load a preset to explore complex molecules. Happy building!',
  },
]

interface TutorialOverlayProps {
  onComplete: () => void
}

/**
 * TutorialOverlay - Interactive onboarding for molecule builder
 *
 * Features:
 * - Step-by-step guided tour
 * - Highlights specific UI elements
 * - Keyboard navigation (Arrow keys, Escape)
 * - Progress indicator
 * - Can be skipped or dismissed
 *
 * @component
 */
export default function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetPosition, setTargetPosition] = useState<DOMRect | null>(null)

  const step = TUTORIAL_STEPS[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TUTORIAL_STEPS.length - 1
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100

  // Update target element position when step changes
  // Using useLayoutEffect for DOM measurements with deferred setState
  useLayoutEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target)
      if (element) {
        const rect = element.getBoundingClientRect()
        // Defer setState to avoid cascading renders
        requestAnimationFrame(() => {
          setTargetPosition(rect)
        })
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      requestAnimationFrame(() => {
        setTargetPosition(null)
      })
    }
  }, [currentStep, step.target])

  // Handler functions
  const handleNext = useCallback(() => {
    if (!isLast) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, isLast])

  const handlePrevious = useCallback(() => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep, isFirst])

  const handleSkip = useCallback(() => {
    if (confirm('Are you sure you want to skip the tutorial? You can restart it anytime from the help menu.')) {
      onComplete()
    }
  }, [onComplete])

  const handleComplete = useCallback(() => {
    onComplete()
  }, [onComplete])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip()
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        if (isLast) {
          handleComplete()
        } else {
          handleNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, isFirst, isLast, handleComplete, handleNext, handlePrevious, handleSkip])

  // Calculate tooltip position based on target and position preference
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetPosition || !step.target) {
      // Center of screen if no target
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    }

    const margin = 20

    switch (step.position) {
      case 'top':
        return {
          position: 'fixed',
          top: `${targetPosition.top - margin}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        }
      case 'bottom':
        return {
          position: 'fixed',
          top: `${targetPosition.bottom + margin}px`,
          left: `${targetPosition.left + targetPosition.width / 2}px`,
          transform: 'translateX(-50%)',
        }
      case 'left':
        return {
          position: 'fixed',
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.left - margin}px`,
          transform: 'translate(-100%, -50%)',
        }
      case 'right':
        return {
          position: 'fixed',
          top: `${targetPosition.top + targetPosition.height / 2}px`,
          left: `${targetPosition.right + margin}px`,
          transform: 'translateY(-50%)',
        }
      default:
        return {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-description"
      aria-modal="true"
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Highlight target element */}
      {targetPosition && step.target && (
        <>
          {/* Highlight box */}
          <div
            className="absolute rounded-lg border-4 border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.6)] animate-pulse-premium pointer-events-none"
            style={{
              top: `${targetPosition.top - 8}px`,
              left: `${targetPosition.left - 8}px`,
              width: `${targetPosition.width + 16}px`,
              height: `${targetPosition.height + 16}px`,
            }}
          />
          {/* Cut-out to show element */}
          <div
            className="absolute bg-transparent pointer-events-none"
            style={{
              top: `${targetPosition.top}px`,
              left: `${targetPosition.left}px`,
              width: `${targetPosition.width}px`,
              height: `${targetPosition.height}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
            }}
          />
        </>
      )}

      {/* Tutorial tooltip */}
      <div
        className="w-full max-w-md rounded-2xl border border-cyan-400/50 bg-slate-900 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        style={getTooltipStyle()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 id="tutorial-title" className="text-xl font-bold text-white">
              {step.title}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Step {currentStep + 1} of {TUTORIAL_STEPS.length}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Skip tutorial"
            title="Skip tutorial (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Description */}
        <p
          id="tutorial-description"
          className="mt-4 whitespace-pre-line text-sm text-slate-300"
        >
          {step.description}
        </p>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              isFirst
                ? 'cursor-not-allowed border-white/10 bg-white/5 text-slate-500'
                : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
            }`}
            aria-label="Previous step"
            title={isFirst ? '' : 'Previous (← Arrow)'}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex gap-1.5">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-6 bg-cyan-400'
                    : index < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-white/20'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          <button
            onClick={isLast ? handleComplete : handleNext}
            className="flex items-center gap-2 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_4px_12px_rgba(34,211,238,0.2)] transition hover:bg-cyan-500/25"
            aria-label={isLast ? 'Complete tutorial' : 'Next step'}
            title={isLast ? 'Complete tutorial' : 'Next (→ Arrow)'}
          >
            {isLast ? 'Get Started!' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-500">
          <span>← → Navigate</span>
          <span>•</span>
          <span>Esc Skip</span>
        </div>
      </div>
    </div>
  )
}
