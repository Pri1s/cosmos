import { describe, expect, it } from 'vitest'
import { rectsOverlap } from './floating-panels'
import {
  getResponsiveFocusMetrics,
  getFocusBackButtonRect,
  getFocusPanelLayout,
  getFocusRenderRect,
} from './focus-panel-layout'

describe('focus panel layout', () => {
  it('scales panel metrics down on smaller viewports and up on larger ones', () => {
    const compact = getResponsiveFocusMetrics(1100, 720)
    const roomy = getResponsiveFocusMetrics(1680, 1050)

    expect(compact.guideMinSize.width).toBeLessThan(roomy.guideMinSize.width)
    expect(compact.narrationMinSize.height).toBeLessThan(roomy.narrationMinSize.height)
    expect(compact.panelGap).toBeLessThan(roomy.panelGap)
  })

  it('uses a non-overlapping fallback layout when split placement cannot fit the voice panel', () => {
    const viewportWidth = 1180
    const viewportHeight = 768
    const renderRect = getFocusRenderRect(viewportWidth, viewportHeight)
    const backButtonRect = getFocusBackButtonRect(viewportWidth, viewportHeight)
    const { guideRect, knowledgeRect, voiceRect } = getFocusPanelLayout(
      viewportWidth,
      viewportHeight,
      { x: 927, y: 24, width: 380, height: 720 },
      { x: 915, y: 78, width: 392, height: 648 },
      { x: 36, y: 430, width: 360, height: 280 }
    )

    expect(rectsOverlap(guideRect, knowledgeRect, 0)).toBe(false)
    expect(rectsOverlap(guideRect, voiceRect, 0)).toBe(false)
    expect(rectsOverlap(knowledgeRect, voiceRect, 0)).toBe(false)
    expect(rectsOverlap(guideRect, renderRect, 0)).toBe(false)
    expect(rectsOverlap(knowledgeRect, renderRect, 0)).toBe(false)
    expect(rectsOverlap(voiceRect, renderRect, 0)).toBe(false)
    expect(rectsOverlap(knowledgeRect, backButtonRect, 18)).toBe(false)
    expect(rectsOverlap(voiceRect, backButtonRect, 18)).toBe(false)
    expect(knowledgeRect.x).toBeGreaterThan(renderRect.x + renderRect.width)
    expect(voiceRect.x).toBeGreaterThan(renderRect.x + renderRect.width)
  })

  it('places the voice panel under the node panel on the right when the viewport is wide enough', () => {
    const viewportWidth = 1600
    const viewportHeight = 900
    const renderRect = getFocusRenderRect(viewportWidth, viewportHeight)
    const backButtonRect = getFocusBackButtonRect(viewportWidth, viewportHeight)
    const metrics = getResponsiveFocusMetrics(viewportWidth, viewportHeight)
    const { guideRect, knowledgeRect, voiceRect } = getFocusPanelLayout(
      viewportWidth,
      viewportHeight,
      { x: 1192, y: 24, width: 380, height: 760 },
      { x: 1176, y: 78, width: 392, height: 700 },
      { x: 36, y: 450, width: 360, height: 280 }
    )

    expect(guideRect.width).toBe(380)
    expect(guideRect.x + guideRect.width + metrics.panelGap).toBeLessThanOrEqual(renderRect.x)
    expect(knowledgeRect.x).toBeGreaterThan(renderRect.x + renderRect.width)
    expect(voiceRect.x + voiceRect.width).toBe(knowledgeRect.x + knowledgeRect.width)
    expect(voiceRect.x).toBeGreaterThan(renderRect.x + renderRect.width)
    expect(voiceRect.width).toBeGreaterThanOrEqual(metrics.narrationMinSize.width)
    expect(voiceRect.height).toBeGreaterThan(metrics.narrationMinSize.height)
    expect(voiceRect.y).toBeGreaterThan(knowledgeRect.y + knowledgeRect.height)
    expect(rectsOverlap(guideRect, renderRect, metrics.panelGap)).toBe(false)
    expect(rectsOverlap(knowledgeRect, renderRect, metrics.panelGap)).toBe(false)
    expect(rectsOverlap(voiceRect, renderRect, metrics.panelGap)).toBe(false)
    expect(rectsOverlap(guideRect, backButtonRect, 18)).toBe(false)
    expect(rectsOverlap(knowledgeRect, backButtonRect, 18)).toBe(false)
    expect(rectsOverlap(guideRect, knowledgeRect, 24)).toBe(false)
    expect(rectsOverlap(voiceRect, knowledgeRect, 0)).toBe(false)
    expect(rectsOverlap(guideRect, voiceRect, 24)).toBe(false)
  })
})
