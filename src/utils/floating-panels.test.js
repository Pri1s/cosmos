import { describe, expect, it } from 'vitest'
import {
  clampPanelRect,
  getSafeViewportCenter,
  getViewportBounds,
  movePanelRect,
  placePanelAroundRect,
  rectsOverlap,
  resolvePanelCollision,
  resizePanelRect,
} from './floating-panels'

describe('floating panel geometry', () => {
  it('clamps oversized panels into the viewport', () => {
    const bounds = getViewportBounds(1200, 800, 16)
    const rect = clampPanelRect(
      { x: -100, y: -50, width: 1400, height: 900 },
      bounds,
      { width: 280, height: 240 }
    )

    expect(rect).toEqual({
      x: 16,
      y: 16,
      width: 1168,
      height: 768,
    })
  })

  it('prevents dragging past the viewport edges', () => {
    const bounds = getViewportBounds(1000, 700, 20)
    const rect = movePanelRect(
      { x: 40, y: 60, width: 300, height: 240 },
      900,
      600,
      bounds,
      { width: 280, height: 200 }
    )

    expect(rect).toEqual({
      x: 680,
      y: 440,
      width: 300,
      height: 240,
    })
  })

  it('limits resize growth to the remaining viewport space', () => {
    const bounds = getViewportBounds(900, 680, 16)
    const rect = resizePanelRect(
      { x: 500, y: 120, width: 260, height: 300 },
      400,
      500,
      bounds,
      { width: 240, height: 220 }
    )

    expect(rect).toEqual({
      x: 500,
      y: 120,
      width: 384,
      height: 544,
    })
  })

  it('detects overlap with a minimum gap', () => {
    const a = { x: 100, y: 100, width: 280, height: 200 }
    const b = { x: 370, y: 120, width: 260, height: 180 }

    expect(rectsOverlap(a, b, 16)).toBe(true)
    expect(rectsOverlap(a, b, 40)).toBe(true)
    expect(rectsOverlap(a, b, 80)).toBe(true)
  })

  it('pushes a moving panel away from an anchor panel', () => {
    const bounds = getViewportBounds(1400, 900, 16)
    const resolved = resolvePanelCollision(
      { x: 980, y: 40, width: 360, height: 420 },
      { x: 940, y: 120, width: 380, height: 520 },
      bounds,
      { width: 320, height: 360 },
      24
    )

    expect(rectsOverlap(
      { x: 980, y: 40, width: 360, height: 420 },
      resolved,
      24
    )).toBe(false)
  })

  it('falls back to the next safe side when the preferred side still overlaps', () => {
    const bounds = getViewportBounds(1400, 900, 16)
    const placed = placePanelAroundRect(
      { x: 360, y: 140, width: 420, height: 360 },
      { x: 520, y: 220, width: 380, height: 520 },
      bounds,
      { width: 320, height: 360 },
      ['left', 'right', 'bottom', 'top'],
      24
    )

    expect(placed).toEqual({
      x: 804,
      y: 220,
      width: 380,
      height: 520,
    })
    expect(rectsOverlap(
      { x: 360, y: 140, width: 420, height: 360 },
      placed,
      24
    )).toBe(false)
  })

  it('finds a safe viewport center away from an occluding panel', () => {
    const center = getSafeViewportCenter(1400, 900, {
      x: 1000,
      y: 40,
      width: 360,
      height: 620,
    })

    expect(center).toEqual({
      x: 488,
      y: 450,
    })
  })
})
