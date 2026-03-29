import { useMemo } from 'react'

const SPOTLIGHT_PAD = 12
const TOOLTIP_GAP = 16
const TOOLTIP_WIDTH = 360
const TOOLTIP_HEIGHT_EST = 228
const VP_PAD = 16

function getTooltipStyle(spotlightRect, position) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Center position (no spotlight target)
  if (!spotlightRect || position === 'center') {
    return {
      left: `${Math.max(VP_PAD, (vw - TOOLTIP_WIDTH) / 2)}px`,
      top: `${Math.max(VP_PAD, (vh - TOOLTIP_HEIGHT_EST) / 2)}px`,
      width: `${TOOLTIP_WIDTH}px`,
    }
  }

  const pad = SPOTLIGHT_PAD + TOOLTIP_GAP
  let left, top

  switch (position) {
    case 'right':
      left = spotlightRect.x + spotlightRect.width + pad
      top = spotlightRect.y + spotlightRect.height / 2 - TOOLTIP_HEIGHT_EST / 2
      break
    case 'left':
      left = spotlightRect.x - TOOLTIP_WIDTH - pad
      top = spotlightRect.y + spotlightRect.height / 2 - TOOLTIP_HEIGHT_EST / 2
      break
    case 'bottom':
      left = spotlightRect.x + spotlightRect.width / 2 - TOOLTIP_WIDTH / 2
      top = spotlightRect.y + spotlightRect.height + pad
      break
    case 'top':
      left = spotlightRect.x + spotlightRect.width / 2 - TOOLTIP_WIDTH / 2
      top = spotlightRect.y - TOOLTIP_HEIGHT_EST - pad
      break
    default:
      left = spotlightRect.x + spotlightRect.width + pad
      top = spotlightRect.y
  }

  // Clamp to viewport
  left = Math.max(VP_PAD, Math.min(left, vw - TOOLTIP_WIDTH - VP_PAD))
  top = Math.max(VP_PAD, Math.min(top, vh - TOOLTIP_HEIGHT_EST - VP_PAD))

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${TOOLTIP_WIDTH}px`,
  }
}

export default function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  spotlightRect,
  onNext,
  onBack,
  onSkip,
}) {
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1

  const tooltipStyle = useMemo(
    () => getTooltipStyle(spotlightRect, step?.tooltipPosition),
    [spotlightRect, step?.tooltipPosition]
  )

  // Spotlight cutout rect with padding
  const cutout = spotlightRect
    ? {
        x: spotlightRect.x - SPOTLIGHT_PAD,
        y: spotlightRect.y - SPOTLIGHT_PAD,
        width: spotlightRect.width + SPOTLIGHT_PAD * 2,
        height: spotlightRect.height + SPOTLIGHT_PAD * 2,
      }
    : null

  return (
    <div className="tour-overlay">
      <svg
        className="tour-spotlight"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {cutout && (
              <rect
                className="tour-cutout"
                x={cutout.x}
                y={cutout.y}
                width={cutout.width}
                height={cutout.height}
                rx="18"
                ry="18"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.62)"
          mask="url(#tour-mask)"
        />
      </svg>

      {cutout && (
        <div
          className="tour-spotlight-ring"
          style={{
            left: `${cutout.x}px`,
            top: `${cutout.y}px`,
            width: `${cutout.width}px`,
            height: `${cutout.height}px`,
          }}
        />
      )}

      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-tooltip__eyebrow">Discovery Story</div>
        <h3 className="tour-tooltip__title">{step?.title}</h3>
        <p className="tour-tooltip__text">{step?.body}</p>
        <div className="tour-tooltip__nav">
          <button
            className="tour-tooltip__skip"
            onClick={onSkip}
          >
            Skip story
          </button>
          <div className="tour-tooltip__right">
            <span className="tour-tooltip__progress">
              Chapter {stepIndex + 1} of {totalSteps}
            </span>
            {!isFirst && (
              <button className="tour-tooltip__back" onClick={onBack}>
                Back
              </button>
            )}
            <button className="tour-tooltip__next" onClick={onNext}>
              {isLast ? 'Finish story' : 'Next chapter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
