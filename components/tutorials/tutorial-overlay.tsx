'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/lib/tutorials/context';
import { X, ChevronLeft, ChevronRight, Play, Pause, FastForward, Volume2, VolumeX } from 'lucide-react';

function computeTooltipPosition(
  rect: DOMRect,
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center' | undefined
): React.CSSProperties {
  const offset = 20;
  const tooltipWidth = 400;
  const tooltipHeight = 200;

  switch (placement) {
    case 'top':
      return {
        bottom: `${window.innerHeight - rect.top + offset}px`,
        left: `${Math.max(
          offset,
          Math.min(
            window.innerWidth - tooltipWidth - offset,
            rect.left + rect.width / 2 - tooltipWidth / 2
          )
        )}px`,
      };
    case 'bottom':
      return {
        top: `${rect.bottom + offset}px`,
        left: `${Math.max(
          offset,
          Math.min(
            window.innerWidth - tooltipWidth - offset,
            rect.left + rect.width / 2 - tooltipWidth / 2
          )
        )}px`,
      };
    case 'left':
      return {
        top: `${Math.max(
          offset,
          Math.min(
            window.innerHeight - tooltipHeight - offset,
            rect.top + rect.height / 2 - tooltipHeight / 2
          )
        )}px`,
        right: `${window.innerWidth - rect.left + offset}px`,
      };
    case 'right':
      return {
        top: `${Math.max(
          offset,
          Math.min(
            window.innerHeight - tooltipHeight - offset,
            rect.top + rect.height / 2 - tooltipHeight / 2
          )
        )}px`,
        left: `${rect.right + offset}px`,
      };
    case 'center':
    default:
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
  }
}

export function TutorialOverlay() {
  const { state, nextStep, previousStep, skipTutorial, pauseTutorial, resumeTutorial, updatePreferences } = useTutorial();
  const currentTargetRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);

  const { isActive, currentTutorial, currentStep, isPaused, showSpotlight, preferences } = state;

  useEffect(() => {
    if (isActive && currentTutorial) {
      const step = currentTutorial.steps[currentStep];
      if (step) {
        const target = document.querySelector(step.target) as HTMLElement;
        currentTargetRef.current = target;
        
        // Execute beforeShow callback if provided
        if (step.beforeShow) {
          step.beforeShow();
        }

        // Scroll target into view and measure position
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });

          const rect = target.getBoundingClientRect();
          requestAnimationFrame(() => {
            setSpotlightRect(rect);
            setTooltipStyle(computeTooltipPosition(rect, step.placement));
          });

          // Add highlight class
          if (step.highlight) {
            target.classList.add('tutorial-highlight');
          }
        }

        // Execute afterShow callback if provided
        if (step.afterShow) {
          setTimeout(() => step.afterShow?.(), 300);
        }
      }
    } else {
      // Clean up highlights when tutorial ends
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
      });
      currentTargetRef.current = null;
      requestAnimationFrame(() => {
        setSpotlightRect(null);
        setTooltipStyle(null);
      });
    }
  }, [isActive, currentTutorial, currentStep]);

  if (!isActive || !currentTutorial) return null;

  const currentStepData = currentTutorial.steps[currentStep];
  if (!currentStepData) return null;

  const isLastStep = currentStep >= currentTutorial.steps.length - 1;
  const progress = ((currentStep + 1) / currentTutorial.steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      skipTutorial();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      previousStep();
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Spotlight Overlay */}
          {showSpotlight && spotlightRect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 pointer-events-none"
            >
              <div className="absolute inset-0 bg-black bg-opacity-50" />
              <div
                className="absolute bg-transparent border-4 border-blue-400 rounded-lg"
                style={{
                  top: spotlightRect.top - 8,
                  left: spotlightRect.left - 8,
                  width: spotlightRect.width + 16,
                  height: spotlightRect.height + 16,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
              />
            </motion.div>
          )}

          {/* Tutorial Tooltip */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md"
            style={
              tooltipStyle ?? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                    {currentStep + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {currentTutorial.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Step {currentStep + 1} of {currentTutorial.steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={skipTutorial}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Close tutorial"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 pt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <motion.div
                  className="bg-blue-500 h-1 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {currentStepData.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {currentStepData.content}
              </p>

              {/* Interactive indicator */}
              {currentStepData.interactive && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    💡 Try this yourself! {currentStepData.action && `(${currentStepData.action} the highlighted element)`}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => preferences.narration ? updatePreferences({ narration: false }) : updatePreferences({ narration: true })}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label="Toggle narration"
                >
                  {preferences.narration ? (
                    <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                <button
                  onClick={isPaused ? resumeTutorial : pauseTutorial}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label={isPaused ? "Resume tutorial" : "Pause tutorial"}
                >
                  {isPaused ? (
                    <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Pause className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={skipTutorial}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <FastForward className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-1"
                >
                  <span>{isLastStep ? 'Finish' : 'Next'}</span>
                  {!isLastStep && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
