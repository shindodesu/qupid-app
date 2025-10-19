'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { DiscoverFilters } from '@/types/search'

interface FilterContextType {
  showFilters: boolean
  setShowFilters: (show: boolean) => void
  filters: DiscoverFilters
  setFilters: (filters: DiscoverFilters) => void
  onApplyFilters: () => void
  onClearFilters: () => void
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<DiscoverFilters>({})

  const onApplyFilters = () => {
    setShowFilters(false)
  }

  const onClearFilters = () => {
    setFilters({})
    setShowFilters(false)
  }

  return (
    <FilterContext.Provider
      value={{
        showFilters,
        setShowFilters,
        filters,
        setFilters,
        onApplyFilters,
        onClearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}
