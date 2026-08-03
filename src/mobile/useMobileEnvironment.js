import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { MOBILE_BREAKPOINT } from './mobile-utils.js'

const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

export function useMobileEnvironment() {
  const native = Capacitor.isNativePlatform()
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setNarrow(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return { isMobileClient: native || narrow, isNative: native }
}
