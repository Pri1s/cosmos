import { describe, expect, it } from 'vitest'
import { shouldDrawNodeLabel } from './render-helpers'

describe('shouldDrawNodeLabel', () => {
  const missionNode = { id: 'kepler', type: 'mission', name: 'Kepler' }
  const exoplanetNode = { id: 'kepler-22-b', type: 'exoplanet', name: 'Kepler-22 b' }

  it('keeps mission labels visible at normal map zoom', () => {
    expect(shouldDrawNodeLabel(missionNode, 1.05)).toBe(true)
    expect(shouldDrawNodeLabel(missionNode, 0.98)).toBe(false)
  })

  it('hides exoplanet labels until interaction or close zoom', () => {
    expect(shouldDrawNodeLabel(exoplanetNode, 1.3)).toBe(false)
    expect(shouldDrawNodeLabel(exoplanetNode, 1.9, { isNeighbor: true })).toBe(true)
    expect(shouldDrawNodeLabel(exoplanetNode, 2.6)).toBe(true)
  })

  it('always shows labels for hovered or selected nodes', () => {
    expect(shouldDrawNodeLabel(exoplanetNode, 1, { isHovered: true })).toBe(true)
    expect(shouldDrawNodeLabel(exoplanetNode, 1, { isSelected: true })).toBe(true)
  })
})
