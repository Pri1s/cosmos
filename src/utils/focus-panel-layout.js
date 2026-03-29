import { clamp, getViewportBounds } from './floating-panels'
import { scaleViewportValue } from './responsive-scale'

export const GUIDE_PANEL_MIN_SIZE = { width: 320, height: 360 }
export const KNOWLEDGE_PANEL_MIN_SIZE = { width: 320, height: 320 }
export const NARRATION_PANEL_MIN_SIZE = { width: 320, height: 250 }
export const FOCUS_RENDER_MIN_SIZE = { width: 460, height: 400 }
export const FOCUS_PANEL_GAP = 28
const FOCUS_STACK_GAP = 20
const FOCUS_CONTROL_GAP = 18
const BACK_BUTTON_SAFE_RECT = { x: 28, y: 28, width: 120, height: 44 }

export function getResponsiveFocusMetrics(viewportWidth, viewportHeight) {
  const panelGap = scaleViewportValue(FOCUS_PANEL_GAP, viewportWidth, viewportHeight, {
    min: 16,
    max: 32,
  })
  const stackGap = scaleViewportValue(FOCUS_STACK_GAP, viewportWidth, viewportHeight, {
    min: 12,
    max: 24,
  })
  const controlGap = scaleViewportValue(FOCUS_CONTROL_GAP, viewportWidth, viewportHeight, {
    min: 12,
    max: 22,
  })

  return {
    guideMinSize: {
      width: scaleViewportValue(GUIDE_PANEL_MIN_SIZE.width, viewportWidth, viewportHeight, { min: 280, max: 360 }),
      height: scaleViewportValue(GUIDE_PANEL_MIN_SIZE.height, viewportWidth, viewportHeight, { min: 300, max: 420 }),
    },
    knowledgeMinSize: {
      width: scaleViewportValue(KNOWLEDGE_PANEL_MIN_SIZE.width, viewportWidth, viewportHeight, { min: 280, max: 360 }),
      height: scaleViewportValue(KNOWLEDGE_PANEL_MIN_SIZE.height, viewportWidth, viewportHeight, { min: 280, max: 400 }),
    },
    narrationMinSize: {
      width: scaleViewportValue(NARRATION_PANEL_MIN_SIZE.width, viewportWidth, viewportHeight, { min: 280, max: 360 }),
      height: scaleViewportValue(NARRATION_PANEL_MIN_SIZE.height, viewportWidth, viewportHeight, { min: 220, max: 320 }),
    },
    renderMinSize: {
      width: scaleViewportValue(FOCUS_RENDER_MIN_SIZE.width, viewportWidth, viewportHeight, { min: 380, max: 560 }),
      height: scaleViewportValue(FOCUS_RENDER_MIN_SIZE.height, viewportWidth, viewportHeight, { min: 320, max: 480 }),
    },
    renderMaxWidth: scaleViewportValue(700, viewportWidth, viewportHeight, { min: 560, max: 760 }),
    renderMaxHeight: scaleViewportValue(560, viewportWidth, viewportHeight, { min: 440, max: 620 }),
    panelGap,
    stackGap,
    controlGap,
    backButtonRect: {
      x: scaleViewportValue(BACK_BUTTON_SAFE_RECT.x, viewportWidth, viewportHeight, { min: 20, max: 36 }),
      y: scaleViewportValue(BACK_BUTTON_SAFE_RECT.y, viewportWidth, viewportHeight, { min: 20, max: 36 }),
      width: scaleViewportValue(BACK_BUTTON_SAFE_RECT.width, viewportWidth, viewportHeight, { min: 104, max: 136 }),
      height: scaleViewportValue(BACK_BUTTON_SAFE_RECT.height, viewportWidth, viewportHeight, { min: 38, max: 52 }),
    },
  }
}

function roundRect(rect) {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  }
}

function getBackButtonSafeTop(metrics) {
  return metrics.backButtonRect.y + metrics.backButtonRect.height + metrics.controlGap
}

function getAvailableHeight(bounds) {
  return bounds.maxY - bounds.minY
}

function getCenterAlignedStartY(bounds, totalHeight, safeTop) {
  const minY = safeTop
  const maxY = Math.max(minY, bounds.maxY - totalHeight)
  const centeredY = bounds.minY + ((getAvailableHeight(bounds) - totalHeight) / 2)
  return clamp(centeredY, minY, maxY)
}

function getClampedHeight(height, minHeight, maxHeight) {
  return clamp(height, minHeight, Math.max(minHeight, maxHeight))
}

function getBalancedSplitHeights(
  totalHeight,
  primaryPreferredHeight,
  secondaryPreferredHeight,
  primaryMinHeight,
  secondaryMinHeight,
  ratioRange
) {
  const preferredTotal = Math.max(primaryPreferredHeight + secondaryPreferredHeight, 1)
  const preferredRatio = primaryPreferredHeight / preferredTotal
  let primaryHeight = Math.round(totalHeight * clamp(preferredRatio, ratioRange.min, ratioRange.max))
  primaryHeight = clamp(primaryHeight, primaryMinHeight, totalHeight - secondaryMinHeight)
  let secondaryHeight = totalHeight - primaryHeight

  if (secondaryHeight < secondaryMinHeight) {
    secondaryHeight = secondaryMinHeight
    primaryHeight = totalHeight - secondaryHeight
  }

  if (primaryHeight < primaryMinHeight) {
    primaryHeight = primaryMinHeight
    secondaryHeight = totalHeight - primaryHeight
  }

  return [primaryHeight, secondaryHeight]
}

function getGuideRect(bounds, renderRect, guideRect, metrics) {
  const width = clamp(
    guideRect.width,
    metrics.guideMinSize.width,
    renderRect.x - metrics.panelGap - bounds.minX
  )
  const height = getClampedHeight(
    guideRect.height,
    metrics.guideMinSize.height,
    getAvailableHeight(bounds)
  )
  const y = getCenterAlignedStartY(bounds, height, getBackButtonSafeTop(metrics))

  return roundRect({
    x: bounds.minX,
    y,
    width,
    height,
  })
}

function getSplitSideLayout(bounds, renderRect, guideRect, knowledgeRect, narrationRect, metrics) {
  const leftWidth = renderRect.x - metrics.panelGap - bounds.minX
  const rightWidth = bounds.maxX - (renderRect.x + renderRect.width + metrics.panelGap)
  const availableHeight = getAvailableHeight(bounds)
  const canStackRight =
    leftWidth >= metrics.guideMinSize.width &&
    rightWidth >= Math.max(metrics.knowledgeMinSize.width, metrics.narrationMinSize.width) &&
    availableHeight >= metrics.knowledgeMinSize.height + metrics.narrationMinSize.height + metrics.stackGap

  if (!canStackRight) return null

  const knowledgeWidth = clamp(knowledgeRect.width, metrics.knowledgeMinSize.width, rightWidth)
  const narrationWidth = clamp(narrationRect.width, metrics.narrationMinSize.width, rightWidth)
  const stackAvailableHeight = availableHeight - metrics.stackGap
  const [knowledgeHeight, voiceHeight] = getBalancedSplitHeights(
    stackAvailableHeight,
    knowledgeRect.height,
    narrationRect.height,
    metrics.knowledgeMinSize.height,
    metrics.narrationMinSize.height,
    { min: 0.54, max: 0.66 }
  )

  const totalRightHeight = knowledgeHeight + voiceHeight + metrics.stackGap
  const rightStartY = getCenterAlignedStartY(bounds, totalRightHeight, bounds.minY)

  return {
    renderRect,
    guideRect: getGuideRect(bounds, renderRect, guideRect, metrics),
    knowledgeRect: roundRect({
      x: bounds.maxX - knowledgeWidth,
      y: rightStartY,
      width: knowledgeWidth,
      height: knowledgeHeight,
    }),
    voiceRect: roundRect({
      x: bounds.maxX - narrationWidth,
      y: rightStartY + knowledgeHeight + metrics.stackGap,
      width: narrationWidth,
      height: voiceHeight,
    }),
  }
}

function getStackedRectSequence(bounds, widths, heights, placeOnLeft, metrics) {
  const totalHeight = heights.reduce((sum, height) => sum + height, 0) + (metrics.stackGap * (heights.length - 1))
  const startY = getCenterAlignedStartY(
    bounds,
    totalHeight,
    placeOnLeft ? getBackButtonSafeTop(metrics) : bounds.minY
  )

  return heights.map((height, index) => ({
    x: placeOnLeft ? bounds.minX : bounds.maxX - widths[index],
    y: startY + heights.slice(0, index).reduce((sum, value) => sum + value, 0) + (metrics.stackGap * index),
    width: widths[index],
    height,
  }))
}

function getStackedFocusPanelLayout(bounds, renderRect, guideRect, knowledgeRect, narrationRect, metrics) {
  const leftWidth = renderRect.x - metrics.panelGap - bounds.minX
  const rightWidth = bounds.maxX - (renderRect.x + renderRect.width + metrics.panelGap)
  const placeOnLeft = leftWidth > rightWidth
  const columnWidth = Math.max(
    placeOnLeft ? leftWidth : rightWidth,
    metrics.guideMinSize.width,
    metrics.knowledgeMinSize.width,
    metrics.narrationMinSize.width
  )
  const availableHeight = getAvailableHeight(bounds)

  const knowledgeWidth = clamp(knowledgeRect.width, metrics.knowledgeMinSize.width, columnWidth)
  const narrationWidth = clamp(narrationRect.width, metrics.narrationMinSize.width, columnWidth)
  const guideWidth = clamp(guideRect.width, metrics.guideMinSize.width, columnWidth)

  const maxKnowledgeHeight = availableHeight - metrics.narrationMinSize.height - metrics.guideMinSize.height - (metrics.stackGap * 2)
  const knowledgeHeight = getClampedHeight(
    knowledgeRect.height,
    metrics.knowledgeMinSize.height,
    maxKnowledgeHeight
  )
  const maxNarrationHeight = availableHeight - knowledgeHeight - metrics.guideMinSize.height - (metrics.stackGap * 2)
  const narrationHeight = getClampedHeight(
    narrationRect.height,
    metrics.narrationMinSize.height,
    maxNarrationHeight
  )
  const maxGuideHeight = availableHeight - knowledgeHeight - narrationHeight - (metrics.stackGap * 2)
  const guideHeight = getClampedHeight(
    guideRect.height,
    metrics.guideMinSize.height,
    maxGuideHeight
  )

  const [knowledgePanel, narrationPanel, guidePanel] = getStackedRectSequence(
    bounds,
    [knowledgeWidth, narrationWidth, guideWidth],
    [knowledgeHeight, narrationHeight, guideHeight],
    placeOnLeft,
    metrics
  )

  return {
    renderRect,
    knowledgeRect: roundRect(knowledgePanel),
    voiceRect: roundRect(narrationPanel),
    guideRect: roundRect(guidePanel),
  }
}

export function getFocusRenderRect(viewportWidth, viewportHeight) {
  const metrics = getResponsiveFocusMetrics(viewportWidth, viewportHeight)
  const maxSplitWidth = viewportWidth
    - (32 + Math.max(metrics.guideMinSize.width, metrics.narrationMinSize.width) + metrics.knowledgeMinSize.width + (metrics.panelGap * 2))
  const width = Math.min(
    Math.max(viewportWidth * 0.44, metrics.renderMinSize.width),
    metrics.renderMaxWidth,
    Math.max(metrics.renderMinSize.width, maxSplitWidth)
  )
  const height = Math.min(Math.max(viewportHeight * 0.58, metrics.renderMinSize.height), metrics.renderMaxHeight)
  const centerX = viewportWidth * 0.5
  const centerY = viewportHeight * 0.46

  return roundRect({
    x: centerX - (width / 2),
    y: centerY - (height / 2),
    width,
    height,
  })
}

export function getFocusBackButtonRect(viewportWidth = 1440, viewportHeight = 900) {
  return getResponsiveFocusMetrics(viewportWidth, viewportHeight).backButtonRect
}

export function getFocusPanelLayout(viewportWidth, viewportHeight, guideRect, knowledgeRect, narrationRect) {
  const metrics = getResponsiveFocusMetrics(viewportWidth, viewportHeight)
  const bounds = getViewportBounds(viewportWidth, viewportHeight, 16)
  const renderRect = getFocusRenderRect(viewportWidth, viewportHeight)

  return getSplitSideLayout(bounds, renderRect, guideRect, knowledgeRect, narrationRect, metrics)
    ?? getStackedFocusPanelLayout(bounds, renderRect, guideRect, knowledgeRect, narrationRect, metrics)
}
