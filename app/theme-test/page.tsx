'use client'

import { ThemeToggle, ThemeSelector } from '@/components/theme-toggle'
import { useTheme } from '@/lib/theme-context'

export default function ThemeTest() {
  const { theme, resolvedTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">VerChem Theme System</h1>
          <p className="text-lg text-muted-foreground">
            Current theme: {theme} (resolved: {resolvedTheme})
          </p>
          <div className="flex justify-center gap-4">
            <ThemeToggle />
            <ThemeSelector />
          </div>
        </div>

        {/* Color Palette */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Color Palette</h2>
          
          {/* Primary Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Primary Colors</h3>
            <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="text-center">
                  <div className={`w-12 h-12 bg-primary-${shade} rounded border border-border`} />
                  <span className="text-xs text-muted-foreground">{shade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Secondary Colors</h3>
            <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="text-center">
                  <div className={`w-12 h-12 bg-secondary-${shade} rounded border border-border`} />
                  <span className="text-xs text-muted-foreground">{shade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neutral Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Neutral Colors</h3>
            <div className="grid grid-cols-5 md:grid-cols-11 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="text-center">
                  <div className={`w-12 h-12 bg-neutral-${shade} rounded border border-border`} />
                  <span className="text-xs text-muted-foreground">{shade}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Semantic Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-success rounded border border-border" />
                <span className="text-xs text-muted-foreground">Success</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-warning rounded border border-border" />
                <span className="text-xs text-muted-foreground">Warning</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-destructive rounded border border-border" />
                <span className="text-xs text-muted-foreground">Destructive</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-info rounded border border-border" />
                <span className="text-xs text-muted-foreground">Info</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-muted rounded border border-border" />
                <span className="text-xs text-muted-foreground">Muted</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-accent rounded border border-border" />
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
            </div>
          </div>

          {/* Chemistry Element Colors */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Chemistry Element Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-element-metals rounded border border-border" />
                <span className="text-xs text-muted-foreground">Metals</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-element-nonmetals rounded border border-border" />
                <span className="text-xs text-muted-foreground">Nonmetals</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-element-noble-gases rounded border border-border" />
                <span className="text-xs text-muted-foreground">Noble Gases</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-element-alkali rounded border border-border" />
                <span className="text-xs text-muted-foreground">Alkali</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-element-transition rounded border border-border" />
                <span className="text-xs text-muted-foreground">Transition</span>
              </div>
            </div>
          </div>
        </div>

        {/* Component Examples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Component Examples</h2>
          
          {/* Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="theme-card rounded-lg p-4">
                <h4 className="font-semibold text-card-foreground mb-2">Default Card</h4>
                <p className="text-muted-foreground text-sm">This is a standard themed card with proper contrast.</p>
              </div>
              <div className="theme-card rounded-lg p-4 border-primary-500">
                <h4 className="font-semibold text-card-foreground mb-2">Primary Card</h4>
                <p className="text-muted-foreground text-sm">This card has a primary border color.</p>
              </div>
              <div className="theme-card rounded-lg p-4 border-secondary-500">
                <h4 className="font-semibold text-card-foreground mb-2">Secondary Card</h4>
                <p className="text-muted-foreground text-sm">This card has a secondary border color.</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <button className="theme-button px-4 py-2 rounded-lg font-medium">
                Primary Button
              </button>
              <button className="theme-button-secondary px-4 py-2 rounded-lg font-medium">
                Secondary Button
              </button>
              <button className="px-4 py-2 bg-success text-success-foreground rounded-lg font-medium">
                Success Button
              </button>
              <button className="px-4 py-2 bg-warning text-warning-foreground rounded-lg font-medium">
                Warning Button
              </button>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium">
                Destructive Button
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Inputs</h3>
            <div className="space-y-3 max-w-md">
              <input 
                type="text" 
                placeholder="Default input" 
                className="theme-input w-full px-3 py-2 rounded-lg"
              />
              <input 
                type="text" 
                placeholder="Input with value" 
                value="Sample value"
                className="theme-input w-full px-3 py-2 rounded-lg"
              />
              <textarea 
                placeholder="Textarea" 
                rows={3}
                className="theme-input w-full px-3 py-2 rounded-lg"
              />
            </div>
          </div>

          {/* Gradients */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Gradients</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-20 rounded-lg bg-gradient-primary" />
              <div className="h-20 rounded-lg bg-gradient-secondary" />
              <div className="h-20 rounded-lg bg-gradient-success" />
            </div>
          </div>
        </div>

        {/* Text Examples */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Typography</h2>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-foreground">Heading 1</h1>
            <h2 className="text-3xl font-bold text-foreground">Heading 2</h2>
            <h3 className="text-2xl font-bold text-foreground">Heading 3</h3>
            <p className="text-lg text-foreground">Large paragraph text</p>
            <p className="text-foreground">Regular paragraph text</p>
            <p className="text-sm text-muted-foreground">Small muted text</p>
            <p className="text-xs text-muted-foreground">Extra small muted text</p>
          </div>
        </div>

        {/* Utility Classes */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Utility Classes</h2>
          <div className="space-y-4">
            <div className="theme-bg p-4 rounded-lg">
              <p className="text-foreground">This uses theme-bg class</p>
            </div>
            <div className="p-4">
              <p className="theme-text">This uses theme-text class</p>
            </div>
            <div className="theme-card p-4 rounded-lg">
              <h4 className="text-card-foreground font-semibold">Theme Card</h4>
              <p className="text-card-foreground text-sm">This uses theme-card classes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}