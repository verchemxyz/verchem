// Simple Badge Component
'use client'

import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  children: React.ReactNode
}

export function Badge({ 
  className = '', 
  variant = 'default', 
  children, 
  ...props 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
  
  const variantClasses = {
    default: 'border-transparent bg-primary-500 text-primary-foreground hover:bg-primary-600',
    secondary: 'border-border bg-card text-foreground hover:bg-muted',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:opacity-90',
    outline: 'text-foreground border-border'
  }[variant]
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}