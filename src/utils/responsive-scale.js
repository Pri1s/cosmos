import { clamp } from './floating-panels'

const BASE_VIEWPORT = { width: 1440, height: 900 }
const MIN_SCALE = 0.78
const MAX_SCALE = 1.12

export function getViewportScale(viewportWidth, viewportHeight) {
  return clamp(
    Math.min(
      viewportWidth / BASE_VIEWPORT.width,
      viewportHeight / BASE_VIEWPORT.height
    ),
    MIN_SCALE,
    MAX_SCALE
  )
}

export function scaleViewportValue(baseValue, viewportWidth, viewportHeight, options = {}) {
  const scale = getViewportScale(viewportWidth, viewportHeight)
  const min = options.min ?? Math.round(baseValue * MIN_SCALE)
  const max = options.max ?? Math.round(baseValue * MAX_SCALE)
  return Math.round(clamp(baseValue * scale, min, max))
}
