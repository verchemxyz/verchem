/**
 * Animation Utilities & Spring Configurations
 * Pre-configured animation presets for consistent micro-interactions
 *
 * Uses CSS transitions and @keyframes for performant animations
 */

/**
 * Spring Animation Configurations
 * Based on Framer Motion's spring presets
 */
export const SPRING_CONFIGS = {
  /** Gentle spring - for smooth, comfortable animations */
  gentle: {
    tension: 120,
    friction: 14,
    duration: '0.4s',
    timing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },

  /** Bouncy spring - for playful interactions */
  bouncy: {
    tension: 300,
    friction: 10,
    duration: '0.6s',
    timing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  /** Snappy spring - for quick, responsive feedback */
  snappy: {
    tension: 400,
    friction: 30,
    duration: '0.2s',
    timing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },

  /** Smooth spring - for elegant, flowing animations */
  smooth: {
    tension: 200,
    friction: 20,
    duration: '0.5s',
    timing: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
  },

  /** Wobbly spring - for emphasis */
  wobbly: {
    tension: 180,
    friction: 12,
    duration: '0.8s',
    timing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  /** Stiff spring - for instant, rigid responses */
  stiff: {
    tension: 500,
    friction: 35,
    duration: '0.15s',
    timing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
} as const

/**
 * CSS Transition Strings
 * Ready-to-use transition values
 */
export const TRANSITIONS = {
  gentle: `all ${SPRING_CONFIGS.gentle.duration} ${SPRING_CONFIGS.gentle.timing}`,
  bouncy: `all ${SPRING_CONFIGS.bouncy.duration} ${SPRING_CONFIGS.bouncy.timing}`,
  snappy: `all ${SPRING_CONFIGS.snappy.duration} ${SPRING_CONFIGS.snappy.timing}`,
  smooth: `all ${SPRING_CONFIGS.smooth.duration} ${SPRING_CONFIGS.smooth.timing}`,
  wobbly: `all ${SPRING_CONFIGS.wobbly.duration} ${SPRING_CONFIGS.wobbly.timing}`,
  stiff: `all ${SPRING_CONFIGS.stiff.duration} ${SPRING_CONFIGS.stiff.timing}`,
} as const

/**
 * Preset Animation Classes
 * Add these to elements for instant micro-interactions
 */
export const ANIMATION_CLASSES = {
  /** Scale up on hover */
  scaleHover: 'transition-transform duration-200 hover:scale-105 active:scale-95',

  /** Lift up on hover (with shadow) */
  liftHover: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',

  /** Glow effect on hover */
  glowHover: 'transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]',

  /** Bounce animation */
  bounce: 'animate-bounce',

  /** Pulse animation */
  pulse: 'animate-pulse',

  /** Spin animation */
  spin: 'animate-spin',

  /** Fade in */
  fadeIn: 'animate-fadeIn',

  /** Slide in from left */
  slideInLeft: 'animate-slideInLeft',

  /** Slide in from right */
  slideInRight: 'animate-slideInRight',

  /** Shake animation (for errors) */
  shake: 'animate-shake',

  /** Success pop */
  successPop: 'animate-successPop',
} as const

/**
 * Keyframe Animations CSS
 * Add to globals.css:
 */
export const KEYFRAMES_CSS = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

@keyframes successPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
}
`

/**
 * Molecule Builder Specific Animations
 */
export const MOLECULE_ANIMATIONS = {
  /** Atom appears when placed */
  atomAppear: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: SPRING_CONFIGS.bouncy,
  },

  /** Atom disappears when deleted */
  atomDisappear: {
    initial: { scale: 1, opacity: 1 },
    animate: { scale: 0, opacity: 0 },
    transition: SPRING_CONFIGS.snappy,
  },

  /** Bond appears when created */
  bondAppear: {
    initial: { scaleX: 0, opacity: 0 },
    animate: { scaleX: 1, opacity: 1 },
    transition: SPRING_CONFIGS.smooth,
  },

  /** Selection highlight */
  selection: {
    initial: { scale: 1 },
    animate: { scale: 1.1 },
    transition: SPRING_CONFIGS.snappy,
  },

  /** Unstable atom shake */
  unstableShake: {
    animation: 'shake 0.5s ease-in-out infinite',
  },

  /** Stable molecule success */
  stableSuccess: {
    animation: 'successPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  /** Atom needs electrons blink */
  needsElectronsBlink: {
    animation: 'blink 1.5s ease-in-out infinite',
  },

  /** Hover float */
  hoverFloat: {
    animation: 'float 2s ease-in-out infinite',
  },

  /** Glow effect */
  glow: {
    animation: 'glow 2s ease-in-out infinite',
  },
} as const

/**
 * Get CSS string for inline styles
 *
 * @param config - Spring configuration
 * @returns CSS transition string
 *
 * @example
 * ```tsx
 * <div style={{ transition: getTransition('bouncy') }}>
 * ```
 */
export function getTransition(config: keyof typeof SPRING_CONFIGS): string {
  return TRANSITIONS[config]
}

/**
 * Create custom spring transition
 *
 * @param duration - Duration in milliseconds
 * @param timing - Cubic bezier timing function
 * @returns CSS transition string
 */
export function createSpringTransition(duration: number, timing: string): string {
  return `all ${duration}ms ${timing}`
}

/**
 * Animation utilities
 */

/** Add animation class temporarily (useful for one-time animations) */
export function animateOnce(
  element: HTMLElement,
  animationClass: string,
  duration = 600
): Promise<void> {
  return new Promise((resolve) => {
    element.classList.add(animationClass)

    setTimeout(() => {
      element.classList.remove(animationClass)
      resolve()
    }, duration)
  })
}

/** Trigger success animation on element */
export async function animateSuccess(element: HTMLElement) {
  await animateOnce(element, 'animate-successPop', 600)
}

/** Trigger error animation on element */
export async function animateError(element: HTMLElement) {
  await animateOnce(element, 'animate-shake', 500)
}

/** Trigger attention animation on element */
export async function animateAttention(element: HTMLElement) {
  await animateOnce(element, 'animate-pulse', 1000)
}

/**
 * Canvas-based Animation System
 * For animating bonds and atoms on canvas
 */

export interface CanvasAnimationState {
  type: 'bondBreak' | 'bondForm' | 'atomPulse' | 'particles'
  id: string
  startTime: number
  duration: number
  data: unknown
  easing?: (t: number) => number
}

/**
 * Easing functions for canvas animations
 */
export const CanvasEasing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  elastic: (t: number) => {
    const p = 0.3
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
  },
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },
}

/**
 * Get animation progress (0-1)
 */
export function getCanvasAnimationProgress(animation: CanvasAnimationState, currentTime: number): number {
  const elapsed = currentTime - animation.startTime
  let progress = Math.min(elapsed / animation.duration, 1)

  if (animation.easing) {
    progress = animation.easing(progress)
  }

  return progress
}

/**
 * Check if animation is complete
 */
export function isCanvasAnimationComplete(animation: CanvasAnimationState, currentTime: number): boolean {
  return currentTime - animation.startTime >= animation.duration
}

/**
 * Create bond breaking animation
 */
export function createBondBreakAnimation(
  bondId: number,
  atom1Pos: { x: number; y: number },
  atom2Pos: { x: number; y: number }
): CanvasAnimationState {
  return {
    type: 'bondBreak',
    id: `bond-break-${bondId}-${Date.now()}`,
    startTime: Date.now(),
    duration: 400,
    easing: CanvasEasing.easeOut,
    data: {
      bondId,
      x1: atom1Pos.x,
      y1: atom1Pos.y,
      x2: atom2Pos.x,
      y2: atom2Pos.y,
      particles: createParticles(
        (atom1Pos.x + atom2Pos.x) / 2,
        (atom1Pos.y + atom2Pos.y) / 2,
        6
      ),
    },
  }
}

/**
 * Create bond forming animation
 */
export function createBondFormAnimation(
  bondId: number,
  atom1Pos: { x: number; y: number },
  atom2Pos: { x: number; y: number }
): CanvasAnimationState {
  return {
    type: 'bondForm',
    id: `bond-form-${bondId}-${Date.now()}`,
    startTime: Date.now(),
    duration: 400,
    easing: CanvasEasing.easeInOut,
    data: {
      bondId,
      x1: atom1Pos.x,
      y1: atom1Pos.y,
      x2: atom2Pos.x,
      y2: atom2Pos.y,
    },
  }
}

/**
 * Create atom pulse animation
 */
export function createAtomPulseAnimation(atomId: number): CanvasAnimationState {
  return {
    type: 'atomPulse',
    id: `atom-pulse-${atomId}-${Date.now()}`,
    startTime: Date.now(),
    duration: 600,
    easing: CanvasEasing.elastic,
    data: {
      atomId,
    },
  }
}

/**
 * Particle system
 */
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number // 0-1
  color: string
  size: number
}

/**
 * Create particles for effects
 */
export function createParticles(x: number, y: number, count: number = 6): Particle[] {
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const speed = 1 + Math.random() * 2

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color: `hsl(${40 + Math.random() * 20}, 100%, 60%)`,
      size: 2 + Math.random() * 2,
    })
  }

  return particles
}

/**
 * Update particle
 */
export function updateParticle(particle: Particle, deltaTime: number = 16): Particle {
  return {
    ...particle,
    x: particle.x + particle.vx,
    y: particle.y + particle.vy,
    vy: particle.vy + 0.15, // Gravity
    life: Math.max(0, particle.life - deltaTime / 400),
    size: particle.size * 0.96,
  }
}

/**
 * Draw particle on canvas
 */
export function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  ctx.save()
  ctx.globalAlpha = particle.life
  ctx.fillStyle = particle.color
  ctx.beginPath()
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * Interpolate between two values
 */
export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}
