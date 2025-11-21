import { Loader2, Beaker } from 'lucide-react'

export default function CalculatorsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Beaker className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Loading Calculator
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Preparing your chemistry tools...
          </p>
        </div>

        {/* Skeleton UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
            >
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
