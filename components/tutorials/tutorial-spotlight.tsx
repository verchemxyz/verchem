'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/lib/tutorials/context';

interface SpotlightProps {
  target: string;
  color?: string;
  opacity?: number;
  radius?: number;
  animate?: boolean;
  children?: React.ReactNode;
}

export function TutorialSpotlight({ 
  target, 
  color = '#3B82F6', 
  opacity = 0.3, 
  radius = 8,
  animate = true,
  children 
}: SpotlightProps) {
  const { state } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector(target) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        setTargetElement(element);
      }
    };

    // Initial position update
    updatePosition();

    // Observe DOM changes
    observerRef.current = new MutationObserver(updatePosition);
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Update on window resize and scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [target]);

  if (!state.showSpotlight || !targetElement) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${position.left + position.width / 2}px ${position.top + position.height / 2}px, transparent ${radius}rem, rgba(0, 0, 0, ${opacity}) ${radius + 2}rem)`,
        }}
      >
        {/* Highlight border */}
        <motion.div
          className="absolute border-2 rounded-lg"
          style={{
            top: position.top - 4,
            left: position.left - 4,
            width: position.width + 8,
            height: position.height + 8,
            borderColor: color,
            boxShadow: `0 0 20px ${color}`,
          }}
          animate={animate ? {
            boxShadow: [
              `0 0 20px ${color}`,
              `0 0 40px ${color}`,
              `0 0 20px ${color}`,
            ],
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Pulsing effect */}
        {animate && (
          <motion.div
            className="absolute rounded-lg"
            style={{
              top: position.top - 8,
              left: position.left - 8,
              width: position.width + 16,
              height: position.height + 16,
              backgroundColor: color,
              opacity: 0.2,
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.1, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function TutorialTooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 500,
  theme = 'light' 
}: {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  theme?: 'light' | 'dark';
}) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowStyles = () => {
    const baseStyles = 'absolute w-2 h-2 rotate-45';
    switch (position) {
      case 'top':
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 -mt-1`;
      case 'bottom':
        return `${baseStyles} bottom-full left-1/2 transform -translate-x-1/2 -mb-1`;
      case 'left':
        return `${baseStyles} left-full top-1/2 transform -translate-y-1/2 -ml-1`;
      case 'right':
        return `${baseStyles} right-full top-1/2 transform -translate-y-1/2 -mr-1`;
      default:
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 -mt-1`;
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 ${getPositionStyles()}`}
          >
            <div
              className={`px-3 py-2 rounded-lg shadow-lg text-sm max-w-xs ${
                theme === 'dark'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {content}
              <div
                className={`${getArrowStyles()} ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function InteractiveHotspot({ 
  children, 
  onClick, 
  pulse = true,
  color = '#3B82F6' 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  pulse?: boolean;
  color?: string;
}) {
  return (
    <div className="relative inline-block">
      {children}
      <motion.div
        className="absolute inset-0 rounded-lg cursor-pointer"
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {pulse && (
          <>
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                backgroundColor: color,
                opacity: 0.2,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.1, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-lg border-2"
              style={{
                borderColor: color,
              }}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
