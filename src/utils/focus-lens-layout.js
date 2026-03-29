import { clamp } from './floating-panels'

const DEFAULT_RENDER_SIZE = { width: 700, height: 520 }
const HERO_GAP = 36
export const FOCUS_LENS_PANEL_PADDING = 42

const SLOT_COORDINATES = {
  5: [
    { x: 0, y: -28 },
    { x: -28, y: -18 },
    { x: 28, y: -18 },
    { x: -22, y: 22 },
    { x: 22, y: 22 },
  ],
  6: [
    { x: 0, y: -28 },
    { x: -28, y: -14 },
    { x: 28, y: -15 },
    { x: -28, y: 18 },
    { x: 28, y: 18 },
    { x: 0, y: 32 },
  ],
}

function getRenderSize(renderRect) {
  return {
    width: renderRect?.width ?? DEFAULT_RENDER_SIZE.width,
    height: renderRect?.height ?? DEFAULT_RENDER_SIZE.height,
  }
}

function normalizeVector(vector) {
  const magnitude = Math.hypot(vector.x, vector.y) || 1
  return {
    x: vector.x / magnitude,
    y: vector.y / magnitude,
  }
}

function getFallbackSlotVector(index, total) {
  const angle = ((Math.PI * 2) / total) * index - Math.PI / 2
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
  }
}

function getSlotVector(index, total) {
  const presetVector = SLOT_COORDINATES[total]?.[index]
  return normalizeVector(presetVector ?? getFallbackSlotVector(index, total))
}

function getAxisRadiusRequirement(component, distance) {
  const magnitude = Math.abs(component)
  if (magnitude < 0.08) return Infinity
  return distance / magnitude
}

function getFiniteMinimum(values, fallback) {
  const finiteValues = values.filter(Number.isFinite)
  return finiteValues.length > 0 ? Math.min(...finiteValues) : fallback
}

function getFiniteMaximum(values, fallback) {
  const finiteValues = values.filter(Number.isFinite)
  return finiteValues.length > 0 ? Math.max(...finiteValues) : fallback
}

export function estimateFocusLensSize(title, renderRect) {
  const { width } = getRenderSize(renderRect)
  const maxWidth = Math.max(160, width - (FOCUS_LENS_PANEL_PADDING * 2))
  const titleWidth = 94 + (title.trim().length * 7.4)

  return {
    width: Math.round(clamp(titleWidth, 118, Math.min(228, maxWidth))),
    height: 44,
  }
}

export function getFocusHeroKeepOutRect(renderRect) {
  const { width, height } = getRenderSize(renderRect)
  const heroWidth = clamp(width * 0.34, 258, 320)
  const heroHeight = clamp(height * 0.3, 156, 210)

  return {
    x: (width - heroWidth) / 2,
    y: (height - heroHeight) / 2,
    width: heroWidth,
    height: heroHeight,
  }
}

export function getFocusLensLayouts(lenses, renderRect) {
  if (!Array.isArray(lenses) || lenses.length === 0) return []

  const { width, height } = getRenderSize(renderRect)
  const heroRect = getFocusHeroKeepOutRect({ width, height })
  const centerX = width / 2
  const centerY = height / 2
  const preferredRadius = clamp(Math.min(width, height) * 0.31, 120, 188)

  return lenses.map((lens, index) => {
    const direction = getSlotVector(index, lenses.length)
    const size = estimateFocusLensSize(lens.title ?? '', { width, height })
    const requiredRadius = getFiniteMinimum([
      getAxisRadiusRequirement(direction.x, (heroRect.width / 2) + HERO_GAP + (size.width / 2)),
      getAxisRadiusRequirement(direction.y, (heroRect.height / 2) + HERO_GAP + (size.height / 2)),
    ], preferredRadius)
    const maxRadius = getFiniteMinimum([
      getAxisRadiusRequirement(direction.x, (width / 2) - FOCUS_LENS_PANEL_PADDING - (size.width / 2)),
      getAxisRadiusRequirement(direction.y, (height / 2) - FOCUS_LENS_PANEL_PADDING - (size.height / 2)),
    ], preferredRadius)
    const radius = clamp(
      getFiniteMaximum([preferredRadius, requiredRadius], preferredRadius),
      0,
      Math.max(0, maxRadius)
    )

    const x = clamp(
      centerX + (direction.x * radius),
      FOCUS_LENS_PANEL_PADDING + (size.width / 2),
      width - FOCUS_LENS_PANEL_PADDING - (size.width / 2)
    )
    const y = clamp(
      centerY + (direction.y * radius),
      FOCUS_LENS_PANEL_PADDING + (size.height / 2),
      height - FOCUS_LENS_PANEL_PADDING - (size.height / 2)
    )

    return {
      id: lens.id,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      width: size.width,
      height: size.height,
    }
  })
}
