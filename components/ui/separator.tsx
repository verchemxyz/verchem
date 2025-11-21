// Simple Separator Component
'use client'

import React from 'react'

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

export function Separator({ 
  className = '', 
  orientation = 'horizontal', 
  decorative = true,
  ...props 
}: SeparatorProps) {
  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px'
  }[orientation]
  
  return (
    <div 
      className={`shrink-0 bg-gray-200 ${orientationClasses} ${className}`}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      {...props}
    />
  )
}