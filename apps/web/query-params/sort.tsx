'use client'

import { parseAsString, useQueryState } from 'nuqs'
import React from 'react'

export default function useSortQueryState(defaultValue: string = '') {
  const [isInitialized, setIsInitialized] = React.useState(false)
  const [sort, setLocalSort] = React.useState<string>(defaultValue)

  const [sortQuery, setSortQuery] = useQueryState(
    'sortBy',
    parseAsString.withDefault(defaultValue),
  )

  const setSort = React.useCallback(
    (value: string) => {
      setLocalSort(value)
      setSortQuery(value)
    },
    [setSortQuery],
  )

  React.useEffect(() => {
    if (sortQuery !== sort) {
      setIsInitialized(true)
      setLocalSort(sortQuery ?? defaultValue)
    } else if (!isInitialized) {
      setIsInitialized(true)
    }
  }, [sortQuery, defaultValue])

  return { sort, setSort, isInitialized }
}
