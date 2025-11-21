// VerChem Search Analytics

import { SearchAnalytics, SearchQuery, SearchResult } from './types'
import { SEARCH_ANALYTICS_EVENTS } from './config'

export class SearchAnalyticsTracker {
  private analytics: SearchAnalytics = {
    totalSearches: 0,
    popularQueries: [],
    noResultsQueries: [],
    filterUsage: {},
    searchTypes: {}
  }

  private searchCounts = new Map<string, number>()
  private noResultsCounts = new Map<string, number>()
  private filterUsageCounts = new Map<string, number>()
  private searchTypeCounts = new Map<string, number>()

  constructor() {
    this.loadAnalytics()
  }

  private loadAnalytics() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('verchem-search-analytics')
        if (saved) {
          this.analytics = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading search analytics:', error)
      }
    }
  }

  private saveAnalytics() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('verchem-search-analytics', JSON.stringify(this.analytics))
      } catch (error) {
        console.error('Error saving search analytics:', error)
      }
    }
  }

  trackSearch(query: SearchQuery, results: SearchResult[]) {
    this.analytics.totalSearches++
    
    // Track query popularity
    const queryStr = query.query.toLowerCase().trim()
    if (queryStr) {
      const currentCount = this.searchCounts.get(queryStr) || 0
      this.searchCounts.set(queryStr, currentCount + 1)
    }

    // Track no results queries
    if (results.length === 0 && queryStr) {
      const currentCount = this.noResultsCounts.get(queryStr) || 0
      this.noResultsCounts.set(queryStr, currentCount + 1)
    }

    // Track filter usage
    if (query.filters) {
      Object.keys(query.filters).forEach(filterKey => {
        const currentCount = this.filterUsageCounts.get(filterKey) || 0
        this.filterUsageCounts.set(filterKey, currentCount + 1)
      })
    }

    // Track search types
    if (query.filters.type) {
      query.filters.type.forEach(type => {
        const currentCount = this.searchTypeCounts.get(type) || 0
        this.searchTypeCounts.set(type, currentCount + 1)
      })
    }

    this.updateAnalytics()
    this.saveAnalytics()

    // Track event
    this.trackEvent(SEARCH_ANALYTICS_EVENTS.SEARCH_PERFORMED, {
      query: queryStr,
      filters: query.filters,
      resultCount: results.length
    })
  }

  trackFilterApplied(filterType: string, filterValue: unknown) {
    const currentCount = this.filterUsageCounts.get(filterType) || 0
    this.filterUsageCounts.set(filterType, currentCount + 1)
    this.updateAnalytics()
    this.saveAnalytics()

    this.trackEvent(SEARCH_ANALYTICS_EVENTS.FILTER_APPLIED, {
      filterType,
      filterValue
    })
  }

  trackResultClicked(result: SearchResult, query: string) {
    this.trackEvent(SEARCH_ANALYTICS_EVENTS.RESULT_CLICKED, {
      resultType: result.type,
      resultId: result.id,
      resultTitle: result.title,
      query
    })
  }

  trackVoiceSearchUsed(query: string) {
    this.trackEvent(SEARCH_ANALYTICS_EVENTS.VOICE_SEARCH_USED, { query })
  }

  trackBookmarkCreated(bookmarkName: string, query: string) {
    this.trackEvent(SEARCH_ANALYTICS_EVENTS.BOOKMARK_CREATED, {
      bookmarkName,
      query
    })
  }

  trackHistoryCleared() {
    this.trackEvent(SEARCH_ANALYTICS_EVENTS.HISTORY_CLEARED, {})
  }

  trackExportUsed(format: string, resultCount: number) {
    this.trackEvent(SEARCH_ANALYTICS_EVENTS.EXPORT_USED, {
      format,
      resultCount
    })
  }

  private updateAnalytics() {
    // Update popular queries
    this.analytics.popularQueries = Array.from(this.searchCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }))

    // Update no results queries
    this.analytics.noResultsQueries = Array.from(this.noResultsCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    // Update filter usage
    this.analytics.filterUsage = Object.fromEntries(
      Array.from(this.filterUsageCounts.entries())
        .sort(([,a], [,b]) => b - a)
    )

    // Update search types
    this.analytics.searchTypes = Object.fromEntries(
      Array.from(this.searchTypeCounts.entries())
        .sort(([,a], [,b]) => b - a)
    )
  }

  private trackEvent(eventName: string, properties: Record<string, unknown>) {
    // In a real application, this would send to analytics service
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Search Analytics:', eventName, properties)
    }

    // Here you would integrate with your analytics service
    // Example: Google Analytics, Mixpanel, Amplitude, etc.
    // ga('send', 'event', 'Search', eventName, JSON.stringify(properties))
  }

  getAnalytics(): SearchAnalytics {
    return { ...this.analytics }
  }

  getPopularQueries(limit: number = 10): string[] {
    return this.analytics.popularQueries
      .slice(0, limit)
      .map(item => item.query)
  }

  getNoResultsQueries(limit: number = 10): string[] {
    return this.analytics.noResultsQueries
      .slice(0, limit)
      .map(item => item.query)
  }

  getMostUsedFilters(limit: number = 10): Array<{filter: string, count: number}> {
    return Object.entries(this.analytics.filterUsage)
      .slice(0, limit)
      .map(([filter, count]) => ({ filter, count }))
  }

  getSearchTypeDistribution(): Record<string, number> {
    return { ...this.analytics.searchTypes }
  }

  resetAnalytics() {
    this.analytics = {
      totalSearches: 0,
      popularQueries: [],
      noResultsQueries: [],
      filterUsage: {},
      searchTypes: {}
    }
    this.searchCounts.clear()
    this.noResultsCounts.clear()
    this.filterUsageCounts.clear()
    this.searchTypeCounts.clear()
    this.saveAnalytics()
  }

  exportAnalytics(): string {
    return JSON.stringify(this.analytics, null, 2)
  }

  importAnalytics(data: string) {
    try {
      const imported = JSON.parse(data)
      if (imported && typeof imported === 'object') {
        this.analytics = {
          totalSearches: imported.totalSearches || 0,
          popularQueries: imported.popularQueries || [],
          noResultsQueries: imported.noResultsQueries || [],
          filterUsage: imported.filterUsage || {},
          searchTypes: imported.searchTypes || {}
        }
        
        // Rebuild internal maps
        this.searchCounts.clear()
        this.analytics.popularQueries.forEach(item => {
          this.searchCounts.set(item.query, item.count)
        })
        
        this.noResultsCounts.clear()
        this.analytics.noResultsQueries.forEach(item => {
          this.noResultsCounts.set(item.query, item.count)
        })
        
        this.filterUsageCounts.clear()
        Object.entries(this.analytics.filterUsage).forEach(([filter, count]) => {
          this.filterUsageCounts.set(filter, count as number)
        })
        
        this.searchTypeCounts.clear()
        Object.entries(this.analytics.searchTypes).forEach(([type, count]) => {
          this.searchTypeCounts.set(type, count as number)
        })
        
        this.saveAnalytics()
      }
    } catch (error) {
      console.error('Error importing analytics:', error)
      throw new Error('Invalid analytics data format')
    }
  }
}

// Singleton instance
export const searchAnalytics = new SearchAnalyticsTracker()

// Export for use in components
export default searchAnalytics
