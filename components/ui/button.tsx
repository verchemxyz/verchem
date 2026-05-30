// Simple Button Component
'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: React.ReactNode
}

export function Button({ 
  className = '', 
  variant = 'default', 
  size = 'default', 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background'
  
  const variantClasses = {
    default: 'bg-primary-500 text-primary-foreground hover:bg-primary-600',
    destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
    outline: 'border border-border bg-card text-foreground hover:bg-muted',
    secondary: 'bg-card border border-border text-foreground hover:bg-muted',
    ghost: 'text-foreground hover:bg-muted',
    link: 'text-primary-600 underline-offset-4 hover:underline'
  }[variant]
  
  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  }[size]
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}