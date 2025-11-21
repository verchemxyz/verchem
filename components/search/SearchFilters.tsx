// VerChem Advanced Search Filters Component
'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { SearchFilters as SearchFiltersType } from '../../lib/search/types'

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
  className?: string
}

export function SearchFilters({ filters, onFiltersChange, className = "" }: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['type']))
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const updateFilter = <K extends keyof SearchFiltersType>(key: K, value: SearchFiltersType[K] | undefined) => {
    const updated: SearchFiltersType = { ...localFilters, [key]: value }
    setLocalFilters(updated)
    onFiltersChange(updated)
  }

  const clearFilter = (key: keyof SearchFiltersType) => {
    const updated = { ...localFilters }
    delete updated[key]
    setLocalFilters(updated)
    onFiltersChange(updated)
  }

  const clearAllFilters = () => {
    setLocalFilters({})
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(localFilters).length > 0

  const Section = ({ title, id, children }: { title: string; id: string; children: React.ReactNode }) => {
    const isExpanded = expandedSections.has(id)
    
    return (
      <div className="border-b border-gray-200 pb-4">
        <button
          onClick={() => toggleSection(id)}
          className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-blue-600 transition-colors"
        >
          <span>{title}</span>
          {isExpanded ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-3 space-y-3">
            {children}
          </div>
        )}
      </div>
    )
  }

  const FilterTag = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 inline-flex text-blue-600 hover:text-blue-800"
      >
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  )

  return (
    <div className={`${className}`}>
      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Active Filters</span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {localFilters.type && (
              <FilterTag 
                label={`Type: ${localFilters.type.join(', ')}`} 
                onRemove={() => clearFilter('type')} 
              />
            )}
            {localFilters.category && (
              <FilterTag 
                label={`Category: ${localFilters.category.join(', ')}`} 
                onRemove={() => clearFilter('category')} 
              />
            )}
            {localFilters.molecularWeightRange && (
              <FilterTag 
                label={`MW: ${localFilters.molecularWeightRange.min || 'min'}-${localFilters.molecularWeightRange.max || 'max'}`} 
                onRemove={() => clearFilter('molecularWeightRange')} 
              />
            )}
            {localFilters.atomicNumberRange && (
              <FilterTag 
                label={`Atomic #: ${localFilters.atomicNumberRange.min || 'min'}-${localFilters.atomicNumberRange.max || 'max'}`} 
                onRemove={() => clearFilter('atomicNumberRange')} 
              />
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Content Type */}
        <Section title="Content Type" id="type">
          <div className="space-y-2">
            {['compound', 'element', 'calculator', 'help'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={localFilters.type?.includes(type) || false}
                  onChange={(e) => {
                    const current = localFilters.type || []
                    const updated = e.target.checked
                      ? [...current, type]
                      : current.filter(t => t !== type)
                    updateFilter('type', updated.length > 0 ? updated : undefined)
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Compound-specific filters */}
        <Section title="Compound Properties" id="compound">
          {/* Molecular Weight Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Molecular Weight Range
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={localFilters.molecularWeightRange?.min || ''}
                onChange={(e) => updateFilter('molecularWeightRange', {
                  ...localFilters.molecularWeightRange,
                  min: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="self-center text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={localFilters.molecularWeightRange?.max || ''}
                onChange={(e) => updateFilter('molecularWeightRange', {
                  ...localFilters.molecularWeightRange,
                  max: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Safety Classification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safety Classification
            </label>
            <div className="space-y-2">
              {['flammable', 'toxic', 'corrosive', 'oxidizer', 'explosive'].map(hazard => (
                <label key={hazard} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.safety?.includes(hazard) || false}
                    onChange={(e) => {
                      const current = localFilters.safety || []
                      const updated = e.target.checked
                        ? [...current, hazard]
                        : current.filter(h => h !== hazard)
                      updateFilter('safety', updated.length > 0 ? updated : undefined)
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{hazard}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Element-specific filters */}
        <Section title="Element Properties" id="element">
          {/* Atomic Number Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atomic Number Range
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                min="1"
                max="118"
                value={localFilters.atomicNumberRange?.min || ''}
                onChange={(e) => updateFilter('atomicNumberRange', {
                  ...localFilters.atomicNumberRange,
                  min: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="self-center text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                min="1"
                max="118"
                value={localFilters.atomicNumberRange?.max || ''}
                onChange={(e) => updateFilter('atomicNumberRange', {
                  ...localFilters.atomicNumberRange,
                  max: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Element Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Element Category
            </label>
            <div className="space-y-2">
              {['alkali-metal', 'alkaline-earth-metal', 'transition-metal', 'metalloid', 'nonmetal', 'halogen', 'noble-gas'].map(category => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.elementCategory?.includes(category) || false}
                    onChange={(e) => {
                      const current = localFilters.elementCategory || []
                      const updated = e.target.checked
                        ? [...current, category]
                        : current.filter(c => c !== category)
                      updateFilter('elementCategory', updated.length > 0 ? updated : undefined)
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {category.replace('-', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Block */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Block
            </label>
            <div className="space-y-2">
              {['s', 'p', 'd', 'f'].map(block => (
                <label key={block} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.block?.includes(block) || false}
                    onChange={(e) => {
                      const current = localFilters.block || []
                      const updated = e.target.checked
                        ? [...current, block]
                        : current.filter(b => b !== block)
                      updateFilter('block', updated.length > 0 ? updated : undefined)
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{block.toUpperCase()} Block</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Calculator-specific filters */}
        <Section title="Calculator Properties" id="calculator">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level
            </label>
            <div className="space-y-2">
              {['basic', 'intermediate', 'advanced'].map(difficulty => (
                <label key={difficulty} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.difficulty?.includes(difficulty) || false}
                    onChange={(e) => {
                      const current = localFilters.difficulty || []
                      const updated = e.target.checked
                        ? [...current, difficulty]
                        : current.filter(d => d !== difficulty)
                      updateFilter('difficulty', updated.length > 0 ? updated : undefined)
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{difficulty}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
