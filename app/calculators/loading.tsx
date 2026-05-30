import { Loader2, Beaker } from 'lucide-react'

export default function CalculatorsLoading() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Beaker className="w-8 h-8 text-muted-foreground" />
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Loading Calculator
          </h2>
          <p className="text-muted-foreground">
            Preparing your chemistry tools...
          </p>
        </div>

        {/* Skeleton UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-6 animate-pulse"
            >
              <div className="h-12 w-12 bg-muted rounded-lg mb-4" />
              <div className="h-6 bg-muted rounded mb-2 w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
