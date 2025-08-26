import * as React from 'react'

export function useIsDesktop() {
  const [value, setValue] = React.useState<boolean>()

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia('(min-width: 1024px)')
    result.addEventListener('change', onChange)
    setValue(result.matches)

    return () => result.removeEventListener('change', onChange)
  }, [])

  return value
}

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener('change', onChange)
    setValue(result.matches)

    return () => result.removeEventListener('change', onChange)
  }, [query])

  return value
}
