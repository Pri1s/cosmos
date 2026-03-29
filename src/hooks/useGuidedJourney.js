import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  buildCompletionSummary,
  buildGuidedJourneyModel,
  buildJourneySummary,
  canSetJourneyCurrentFromNode,
  continueJourney,
  getJourneyRecommendations,
  hydrateJourneyState,
  markJourneyNodeVisited,
  pauseJourney,
  restartJourney,
  resumeJourney,
  setJourneyCurrentFromNode,
  startJourney,
} from '../utils/guided-journey'

const STORAGE_KEY = 'cosmos-guided-journey-v1'

function readStoredJourneyState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function useGuidedJourney({
  nodes,
  links,
  setSelectedNode,
  centerOnNode,
  panelOpen = false,
}) {
  const model = useMemo(() => buildGuidedJourneyModel(nodes, links), [links, nodes])
  const [journeyState, setJourneyState] = useState(() => (
    hydrateJourneyState(model, readStoredJourneyState())
  ))

  const currentNode = useMemo(
    () => (journeyState.currentNodeId ? model.nodeMap[journeyState.currentNodeId] ?? null : null),
    [journeyState.currentNodeId, model]
  )
  const activeMission = useMemo(
    () => (journeyState.activeMissionId ? model.nodeMap[journeyState.activeMissionId] ?? null : null),
    [journeyState.activeMissionId, model]
  )
  const recommendations = useMemo(() => (
    getJourneyRecommendations(model, journeyState).map((entry, index) => ({
      ...entry,
      node: model.nodeMap[entry.nodeId] ?? null,
      rank: index + 1,
    }))
  ), [journeyState, model])

  const visitedSet = useMemo(() => new Set(journeyState.visitedNodeIds), [journeyState.visitedNodeIds])
  const currentVisited = currentNode ? visitedSet.has(currentNode.id) : false

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(journeyState))
    } catch {
      // localStorage may be unavailable
    }
  }, [journeyState])

  useEffect(() => {
    if (!currentNode) {
      if (journeyState.status === 'complete') {
        setSelectedNode(null)
      }
      return
    }
    if (journeyState.status === 'complete' || journeyState.status === 'idle') return
    if (!panelOpen) return

    setSelectedNode(currentNode)
    centerOnNode?.(currentNode)
  }, [centerOnNode, currentNode, journeyState.status, panelOpen, setSelectedNode])

  const start = useCallback(() => {
    setJourneyState((current) => startJourney(model, current))
  }, [model])

  const continueTo = useCallback((nodeId = null) => {
    setJourneyState((current) => continueJourney(model, current, nodeId))
  }, [model])

  const pause = useCallback(() => {
    setJourneyState((current) => pauseJourney(model, current))
  }, [model])

  const resume = useCallback(() => {
    setJourneyState((current) => resumeJourney(model, current))
  }, [model])

  const restart = useCallback(() => {
    setJourneyState(restartJourney(model))
  }, [model])

  const markVisited = useCallback(() => {
    setJourneyState((current) => markJourneyNodeVisited(model, current))
  }, [model])

  const setCurrentFromNode = useCallback((nodeId) => {
    setJourneyState((current) => setJourneyCurrentFromNode(model, current, nodeId))
  }, [model])

  const canSetCurrentFromNode = useCallback((nodeId) => (
    canSetJourneyCurrentFromNode(model, journeyState, nodeId)
  ), [model, journeyState])

  const journey = useMemo(() => ({
    ...journeyState,
    totalCount: model.totalCount,
    visitedCount: journeyState.visitedNodeIds.length,
    activeMission,
    currentSummary: currentNode ? buildJourneySummary(model, journeyState, currentNode.id) : '',
    completionSummary: buildCompletionSummary(model, journeyState),
    currentVisited,
  }), [activeMission, currentNode, currentVisited, journeyState, model])

  return {
    journey,
    currentNode,
    recommendations,
    start,
    continueTo,
    pause,
    resume,
    restart,
    markVisited,
    setCurrentFromNode,
    canSetCurrentFromNode,
  }
}
