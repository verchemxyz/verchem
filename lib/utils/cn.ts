import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 *
 * Combines clsx (for conditional classes) and tailwind-merge
 * (to resolve conflicting Tailwind classes)
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * ```ts
 * cn('px-4 py-2', isActive && 'bg-blue-500', className)
 * // With conflicts:
 * cn('px-2 py-1', 'px-4') // Returns: 'py-1 px-4' (px-4 wins)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
