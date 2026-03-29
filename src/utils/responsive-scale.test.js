import { describe, expect, it } from 'vitest'
import { getViewportScale, scaleViewportValue } from './responsive-scale'

describe('responsive scale helpers', () => {
  it('shrinks below the base viewport but respects a lower clamp', () => {
    expect(getViewportScale(1024, 700)).toBeLessThan(1)
    expect(scaleViewportValue(400, 1024, 700, { min: 300, max: 500 })).toBeGreaterThanOrEqual(300)
  })

  it('returns the base value scale near the design viewport', () => {
    expect(getViewportScale(1440, 900)).toBe(1)
    expect(scaleViewportValue(380, 1440, 900, { min: 320, max: 430 })).toBe(380)
  })

  it('grows on larger screens but respects an upper clamp', () => {
    expect(getViewportScale(1920, 1200)).toBeGreaterThan(1)
    expect(scaleViewportValue(380, 1920, 1200, { min: 320, max: 430 })).toBe(426)
  })
})
