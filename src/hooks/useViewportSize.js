import { useState, useEffect } from 'react'

/**
 * Returns [width, height] of the viewport, updated on resize (debounced 100ms).
 */
export default function useViewportSize() {
  const [size, setSize] = useState(() => [window.innerWidth, window.innerHeight])

  useEffect(() => {
    let timer = null
    const handleResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        setSize([window.innerWidth, window.innerHeight])
      }, 100)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return size
}
