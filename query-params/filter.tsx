'use client'

import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import React from 'react'

export type Filter = {
  name: string
  value: string
}

export const deserializeFilter = (filter: string): Filter => {
  const [name, value] = filter.split(':')
  const urlDecodedValue = decodeURIComponent(value)
  return { name, value: urlDecodedValue }
}

export const serializeFilter = (filter: Filter): string => {
  return `${filter.name}:${encodeURIComponent(filter.value)}`
}

export default function useFilterQueryState(defaultValue: Filter[] = []) {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [filters, setLocalFilters] = React.useState<Filter[]>(defaultValue)

  const [filterQuery, setFilterQuery] = useQueryState(
    'filters',
    parseAsArrayOf(parseAsString).withDefault(
      defaultValue.map(serializeFilter),
    ),
  )

  const setFilters = React.useCallback(
    (value: Filter[]) => {
      setLocalFilters(value)
      setFilterQuery(value.map(serializeFilter))
    },
    [setFilterQuery],
  )

  const addFilter = React.useCallback(
    (name: string, value: string) => {
      setFilters([...filters.filter((f) => f.name !== name), { name, value }])
    },
    [setFilters, filters],
  )

  const removeFilter = React.useCallback(
    (name: string) => {
      setFilters(filters.filter((f) => f.name !== name))
    },
    [setFilters, filters],
  )

  const getFilter = React.useCallback(
    (name: string) => {
      return filters.find((f) => f.name === name)
    },
    [filters],
  )

  const clearFilters = React.useCallback(() => {
    setFilters([])
  }, [setFilters])

  React.useEffect(() => {
    const serializedFilters = filters.map(serializeFilter)
    if (JSON.stringify(serializedFilters) !== JSON.stringify(filterQuery)) {
      setIsInitialized(true)
      setLocalFilters(filterQuery.map(deserializeFilter) ?? defaultValue)
    } else if (!isInitialized) {
      setIsInitialized(true)
    }
  }, [filterQuery, defaultValue])

  return {
    filters,
    addFilter,
    removeFilter,
    getFilter,
    clearFilters,
    setFilters,
    isInitialized,
  }
}
