import { describe, expect, it } from 'vitest'
import { rectsOverlap } from './floating-panels'
import {
  FOCUS_LENS_PANEL_PADDING,
  getFocusHeroKeepOutRect,
  getFocusLensLayouts,
} from './focus-lens-layout'

function toRect(layout) {
  return {
    x: layout.x - (layout.width / 2),
    y: layout.y - (layout.height / 2),
    width: layout.width,
    height: layout.height,
  }
}

describe('focus lens layout', () => {
  it('keeps six-lens mission pills outside the hero keep-out area', () => {
    const renderRect = { width: 760, height: 560 }
    const heroRect = getFocusHeroKeepOutRect(renderRect)
    const layouts = getFocusLensLayouts([
      { id: 'mission-role', title: 'Mission Role' },
      { id: 'detection-method', title: 'Detection Method' },
      { id: 'signature-discoveries', title: 'Signature Discoveries' },
      { id: 'legacy', title: 'Legacy' },
      { id: 'why-it-matters', title: 'Why It Matters' },
      { id: 'open-questions', title: 'Open Questions' },
    ], renderRect)

    expect(layouts).toHaveLength(6)

    for (const layout of layouts) {
      expect(rectsOverlap(toRect(layout), heroRect, 0)).toBe(false)
    }

    expect(toRect(layouts[1]).y + toRect(layouts[1]).height).toBeLessThanOrEqual(heroRect.y)
    expect(toRect(layouts[2]).y + toRect(layouts[2]).height).toBeLessThanOrEqual(heroRect.y)
  })

  it('keeps five-lens layouts inside the render panel padding', () => {
    const renderRect = { width: 620, height: 460 }
    const heroRect = getFocusHeroKeepOutRect(renderRect)
    const layouts = getFocusLensLayouts([
      { id: 'discovery', title: 'Discovery' },
      { id: 'earth-comparison', title: 'Earth Comparison' },
      { id: 'habitability', title: 'Habitability' },
      { id: 'extremes', title: 'Extremes' },
      { id: 'open-questions', title: 'Open Questions' },
    ], renderRect)

    expect(layouts).toHaveLength(5)

    for (const layout of layouts) {
      const rect = toRect(layout)
      expect(rectsOverlap(rect, heroRect, 0)).toBe(false)
      expect(rect.x).toBeGreaterThanOrEqual(FOCUS_LENS_PANEL_PADDING)
      expect(rect.y).toBeGreaterThanOrEqual(FOCUS_LENS_PANEL_PADDING)
      expect(rect.x + rect.width).toBeLessThanOrEqual(renderRect.width - FOCUS_LENS_PANEL_PADDING)
      expect(rect.y + rect.height).toBeLessThanOrEqual(renderRect.height - FOCUS_LENS_PANEL_PADDING)
    }
  })
})
