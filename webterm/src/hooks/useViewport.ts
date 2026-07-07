import { useEffect, useState } from 'react'

export const TABLET_BREAKPOINT = 1024
export const COMPACT_BREAKPOINT = 768

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useViewport() {
  const isTablet = useMediaQuery(`(max-width: ${TABLET_BREAKPOINT}px)`)
  const isCompact = useMediaQuery(`(max-width: ${COMPACT_BREAKPOINT}px)`)
  return { isTablet, isCompact, isDesktop: !isTablet }
}
