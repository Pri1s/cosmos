import { useState, useCallback, useEffect, useRef } from 'react'
import { executeTourActions } from '../utils/tour-actions'

const STORAGE_KEY = 'cosmos-discovery-story-completed'
const AUTO_START_DELAY = 1800
const SPOTLIGHT_POLL_MS = 120
const FOCUS_EXIT_CLEANUP_MS = 460

function getSpotlightRect(target) {
  if (!target) return null
  const el = document.querySelector(target)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { x: r.x, y: r.y, width: r.width, height: r.height }
}

export default function useTour({
  steps,
  graphRef,
  enterFocusMode,
  exitFocusMode,
  setSelectedNode,
  setGuideEvent,
  viewMode,
}) {
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })
  const [isTourActive, setIsTourActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [tourPhase, setTourPhase] = useState('idle') // 'idle' | 'executing' | 'showing'
  const [spotlightRect, setSpotlightRect] = useState(null)
  const autoStartedRef = useRef(false)
  const pollRef = useRef(null)
  const actionTimerRef = useRef(null)
  const startTimerRef = useRef(null)

  const cleanupTimerRef = useRef(null)

  const currentStep = isTourActive ? steps[stepIndex] ?? null : null
  const totalSteps = steps.length

  // Poll for spotlight rect while tour is active
  useEffect(() => {
    if (!isTourActive || tourPhase !== 'showing') return
    const target = currentStep?.target ?? null

    const poll = () => {
      setSpotlightRect(getSpotlightRect(target))
    }
    poll()
    pollRef.current = setInterval(poll, SPOTLIGHT_POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [isTourActive, tourPhase, currentStep?.target])

  // Clean up action timer on unmount
  useEffect(() => {
    return () => {
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current)
      if (startTimerRef.current) clearTimeout(startTimerRef.current)
      if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current)
    }
  }, [])

  const goToStep = useCallback(
    (index) => {
      if (index < 0 || index >= steps.length) return

      const step = steps[index]
      setStepIndex(index)

      // Send narration to Stella
      setGuideEvent({
        id: Date.now(),
        type: 'local-stella',
        text: step.narration,
      })

      if (step.actions?.length) {
        setTourPhase('executing')
        executeTourActions(step.actions, {
          graphRef,
          setSelectedNode,
          enterFocusMode,
          exitFocusMode,
        })
        if (actionTimerRef.current) {
          clearTimeout(actionTimerRef.current)
        }
        actionTimerRef.current = setTimeout(() => {
          setTourPhase('showing')
          actionTimerRef.current = null
        }, step.delayMs || 300)
      } else {
        setTourPhase('showing')
      }
    },
    [enterFocusMode, exitFocusMode, graphRef, setGuideEvent, setSelectedNode, steps]
  )

  const startTour = useCallback(() => {
    // Reset app state before starting
    if (viewMode !== 'map') {
      exitFocusMode()
    }
    setSelectedNode(null)

    setIsTourActive(true)
    setTourPhase('idle')
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current)
    }
    // Small delay to let any exit animations settle
    startTimerRef.current = setTimeout(() => {
      goToStep(0)
      startTimerRef.current = null
    }, viewMode !== 'map' ? 500 : 50)
  }, [exitFocusMode, goToStep, setSelectedNode, viewMode])

  const endTour = useCallback(() => {
    setIsTourActive(false)
    setStepIndex(0)
    setTourPhase('idle')
    setSpotlightRect(null)
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current)
      actionTimerRef.current = null
    }
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current)
      startTimerRef.current = null
    }
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current)
      cleanupTimerRef.current = null
    }

    if (viewMode !== 'map') {
      exitFocusMode()
      cleanupTimerRef.current = setTimeout(() => {
        setSelectedNode(null)
        cleanupTimerRef.current = null
      }, FOCUS_EXIT_CLEANUP_MS)
    } else {
      setSelectedNode(null)
    }

    setHasCompletedTour(true)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // localStorage may be unavailable
    }
  }, [exitFocusMode, setSelectedNode, viewMode])

  const nextStep = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      endTour()
      return
    }
    goToStep(stepIndex + 1)
  }, [endTour, goToStep, stepIndex, steps.length])

  const prevStep = useCallback(() => {
    if (stepIndex <= 0) return
    goToStep(stepIndex - 1)
  }, [goToStep, stepIndex])

  const skipTour = useCallback(() => {
    endTour()
  }, [endTour])

  // Auto-start on first visit once graphRef is ready
  useEffect(() => {
    if (autoStartedRef.current || !graphRef) return

    if (hasCompletedTour) {
      autoStartedRef.current = true
      return
    }

    autoStartedRef.current = true
    const timer = setTimeout(() => {
      startTour()
    }, AUTO_START_DELAY)

    return () => clearTimeout(timer)
  }, [graphRef, hasCompletedTour, startTour])

  return {
    hasCompletedTour,
    isTourActive,
    currentStep,
    stepIndex,
    totalSteps,
    tourPhase,
    spotlightRect: tourPhase === 'showing' ? spotlightRect : null,
    nextStep,
    prevStep,
    skipTour,
    startTour,
  }
}
