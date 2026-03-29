export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function getViewportBounds(width, height, padding = 16) {
  return {
    minX: padding,
    minY: padding,
    maxX: width - padding,
    maxY: height - padding,
  }
}

export function clampPanelRect(rect, bounds, minSize) {
  const maxWidth = Math.max(minSize.width, bounds.maxX - bounds.minX)
  const maxHeight = Math.max(minSize.height, bounds.maxY - bounds.minY)
  const width = clamp(rect.width, minSize.width, maxWidth)
  const height = clamp(rect.height, minSize.height, maxHeight)
  const x = clamp(rect.x, bounds.minX, bounds.maxX - width)
  const y = clamp(rect.y, bounds.minY, bounds.maxY - height)

  return { x, y, width, height }
}

export function movePanelRect(rect, deltaX, deltaY, bounds, minSize) {
  return clampPanelRect(
    {
      ...rect,
      x: rect.x + deltaX,
      y: rect.y + deltaY,
    },
    bounds,
    minSize
  )
}

export function resizePanelRect(rect, deltaX, deltaY, bounds, minSize) {
  const maxWidth = Math.max(minSize.width, bounds.maxX - rect.x)
  const maxHeight = Math.max(minSize.height, bounds.maxY - rect.y)

  return {
    ...rect,
    width: clamp(rect.width + deltaX, minSize.width, maxWidth),
    height: clamp(rect.height + deltaY, minSize.height, maxHeight),
  }
}

export function rectsOverlap(a, b, gap = 16) {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  )
}

function overlapArea(a, b) {
  const overlapWidth = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const overlapHeight = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return overlapWidth * overlapHeight
}

export function resolvePanelCollision(anchorRect, movingRect, bounds, minSize, gap = 16) {
  if (!rectsOverlap(anchorRect, movingRect, gap)) {
    return movingRect
  }

  const candidates = [
    { ...movingRect, x: anchorRect.x - movingRect.width - gap },
    { ...movingRect, x: anchorRect.x + anchorRect.width + gap },
    { ...movingRect, y: anchorRect.y - movingRect.height - gap },
    { ...movingRect, y: anchorRect.y + anchorRect.height + gap },
  ].map(candidate => clampPanelRect(candidate, bounds, minSize))

  const rankedCandidates = candidates
    .map(candidate => ({
      candidate,
      distance: Math.abs(candidate.x - movingRect.x) + Math.abs(candidate.y - movingRect.y),
      overlap: overlapArea(anchorRect, candidate),
    }))
    .sort((a, b) => {
      if (a.overlap !== b.overlap) return a.overlap - b.overlap
      return a.distance - b.distance
    })

  return rankedCandidates[0]?.candidate ?? movingRect
}

export function placePanelAroundRect(
  anchorRect,
  movingRect,
  bounds,
  minSize,
  sideOrder = ['right', 'left', 'bottom', 'top'],
  gap = 16
) {
  const candidates = sideOrder.map(side => {
    if (side === 'left') {
      return { ...movingRect, x: anchorRect.x - movingRect.width - gap }
    }
    if (side === 'right') {
      return { ...movingRect, x: anchorRect.x + anchorRect.width + gap }
    }
    if (side === 'top') {
      return { ...movingRect, y: anchorRect.y - movingRect.height - gap }
    }
    return { ...movingRect, y: anchorRect.y + anchorRect.height + gap }
  }).map(candidate => clampPanelRect(candidate, bounds, minSize))

  const rankedCandidates = candidates
    .map((candidate, index) => ({
      candidate,
      sideRank: index,
      distance: Math.abs(candidate.x - movingRect.x) + Math.abs(candidate.y - movingRect.y),
      overlap: overlapArea(anchorRect, candidate),
    }))
    .sort((a, b) => {
      if (a.overlap !== b.overlap) return a.overlap - b.overlap
      if (a.sideRank !== b.sideRank) return a.sideRank - b.sideRank
      return a.distance - b.distance
    })

  return rankedCandidates[0]?.candidate ?? movingRect
}

export function getSafeViewportCenter(width, height, occlusionRect, gap = 24) {
  if (!occlusionRect) {
    return { x: width / 2, y: height / 2 }
  }

  const candidates = [
    { x: 0, y: 0, width: Math.max(0, occlusionRect.x - gap), height },
    {
      x: occlusionRect.x + occlusionRect.width + gap,
      y: 0,
      width: Math.max(0, width - (occlusionRect.x + occlusionRect.width + gap)),
      height,
    },
    { x: 0, y: 0, width, height: Math.max(0, occlusionRect.y - gap) },
    {
      x: 0,
      y: occlusionRect.y + occlusionRect.height + gap,
      width,
      height: Math.max(0, height - (occlusionRect.y + occlusionRect.height + gap)),
    },
  ]
    .filter(candidate => candidate.width > 0 && candidate.height > 0)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height))

  const best = candidates[0]
  if (!best) {
    return { x: width / 2, y: height / 2 }
  }

  return {
    x: best.x + best.width / 2,
    y: best.y + best.height / 2,
  }
}
