import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  clampPanelRect,
  getViewportBounds,
} from '../utils/floating-panels'

function getBounds(padding) {
  return getViewportBounds(window.innerWidth, window.innerHeight, padding)
}

function rectReducer(_state, nextRect) {
  return nextRect
}

function translateRect(rect, deltaX, deltaY) {
  return {
    ...rect,
    x: rect.x + deltaX,
    y: rect.y + deltaY,
  }
}

function resizeRect(rect, deltaX, deltaY, minSize) {
  return {
    ...rect,
    width: Math.max(minSize.width, rect.width + deltaX),
    height: Math.max(minSize.height, rect.height + deltaY),
  }
}

export default function useFloatingPanel({
  enabled,
  initialRect,
  minSize,
  resetKey,
  padding = 16,
  onInteractionStart,
  onInteractionEnd,
}) {
  const [rect, setRect] = useReducer(
    rectReducer,
    clampPanelRect(initialRect, getBounds(padding), minSize)
  )
  const [isInteracting, setIsInteracting] = useState(false)

  const { x, y, width, height } = initialRect
  const { width: minWidth, height: minHeight } = minSize

  // Keep a ref to the latest rect so the resize handler doesn't need rect in its dep array
  const rectRef = useRef(rect)
  useLayoutEffect(() => {
    rectRef.current = rect
  })

  useEffect(() => {
    if (!enabled) return
    setRect(clampPanelRect({ x, y, width, height }, getBounds(padding), { width: minWidth, height: minHeight }))
  }, [enabled, height, minHeight, minWidth, padding, resetKey, width, x, y])

  useEffect(() => {
    if (!enabled) return

    const handleResize = () => {
      setRect(clampPanelRect(rectRef.current, getBounds(padding), { width: minWidth, height: minHeight }))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [enabled, minHeight, minWidth, padding])

  const beginInteraction = useCallback((event, updater, interactionType) => {
    if (!enabled) return

    event.preventDefault()
    setIsInteracting(true)
    onInteractionStart?.()
    const startX = event.clientX
    const startY = event.clientY
    const startRect = rect
    let currentRect = startRect

    const handlePointerMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      currentRect = updater(startRect, deltaX, deltaY, { width: minWidth, height: minHeight })
      setRect(currentRect)
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      setIsInteracting(false)
      onInteractionEnd?.({
        rect: clampPanelRect(currentRect, getBounds(padding), { width: minWidth, height: minHeight }),
        type: interactionType,
      })
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }, [enabled, minHeight, minWidth, onInteractionEnd, onInteractionStart, padding, rect])

  const onDragStart = useCallback((event) => {
    beginInteraction(event, translateRect, 'drag')
  }, [beginInteraction])

  const onResizeStart = useCallback((event) => {
    beginInteraction(event, resizeRect, 'resize')
  }, [beginInteraction])

  const style = useMemo(() => (
    enabled
      ? {
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        }
      : undefined
  ), [enabled, rect])

  return {
    isInteracting,
    rect,
    style,
    setRect,
    onDragStart,
    onResizeStart,
  }
}
