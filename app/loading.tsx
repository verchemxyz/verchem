import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Loading VerChem
        </h2>
        <p className="text-muted-foreground">
          Preparing your chemistry tools...
        </p>
      </div>
    </div>
  )
}
