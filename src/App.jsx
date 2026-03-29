import { useState, useCallback, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import BrainMap from './components/BrainMap'
import SearchBar from './components/SearchBar'
import DetailPanel from './components/DetailPanel'
import GuidePanel from './components/GuidePanel'
import JourneyPanel from './components/JourneyPanel'
import FocusMode from './components/FocusMode'
import useFloatingPanel from './hooks/useFloatingPanel'
import useGuidedJourney from './hooks/useGuidedJourney'
import { nodes, links, getNeighborIds } from './data/graph-data'
import { getFocusLenses } from './utils/focus-lenses'
import {
  clampPanelRect,
  getViewportBounds,
} from './utils/floating-panels'
import {
  getFocusPanelLayout,
  getResponsiveFocusMetrics,
} from './utils/focus-panel-layout'
import { scaleViewportValue } from './utils/responsive-scale'

const FOCUS_ENTER_MS = 650
const FOCUS_EXIT_MS = 420
const DEFAULT_GUIDE_PANEL_WIDTH = 380
const MIN_MAP_PANEL_WIDTH = 420
const DEFAULT_JOURNEY_PANEL_WIDTH = 392
const DEFAULT_JOURNEY_PANEL_HEIGHT = 456

function getResponsiveAppMetrics(viewportWidth, viewportHeight, focusMetrics) {
  const appPadding = scaleViewportValue(18, viewportWidth, viewportHeight, { min: 12, max: 24 })
  const panelGap = scaleViewportValue(18, viewportWidth, viewportHeight, { min: 12, max: 24 })
  const guideWidth = scaleViewportValue(DEFAULT_GUIDE_PANEL_WIDTH, viewportWidth, viewportHeight, {
    min: focusMetrics.guideMinSize.width,
    max: 430,
  })
  const guideTop = scaleViewportValue(24, viewportWidth, viewportHeight, { min: 16, max: 32 })
  const guideOffsetX = scaleViewportValue(28, viewportWidth, viewportHeight, { min: 18, max: 36 })
  const guideHeight = Math.min(
    viewportHeight - (guideTop * 2),
    scaleViewportValue(760, viewportWidth, viewportHeight, { min: 520, max: 820 })
  )
  const knowledgeWidth = scaleViewportValue(392, viewportWidth, viewportHeight, {
    min: focusMetrics.knowledgeMinSize.width,
    max: 440,
  })
  const knowledgeTop = scaleViewportValue(78, viewportWidth, viewportHeight, { min: 56, max: 96 })
  const knowledgeHeight = Math.min(
    viewportHeight - scaleViewportValue(120, viewportWidth, viewportHeight, { min: 90, max: 144 }),
    scaleViewportValue(700, viewportWidth, viewportHeight, { min: 520, max: 760 })
  )
  const voiceWidth = scaleViewportValue(360, viewportWidth, viewportHeight, {
    min: focusMetrics.narrationMinSize.width,
    max: 420,
  })
  const voiceHeight = Math.min(
    viewportHeight - scaleViewportValue(96, viewportWidth, viewportHeight, { min: 72, max: 120 }),
    scaleViewportValue(280, viewportWidth, viewportHeight, { min: focusMetrics.narrationMinSize.height, max: 340 })
  )
  const journeyWidth = scaleViewportValue(DEFAULT_JOURNEY_PANEL_WIDTH, viewportWidth, viewportHeight, {
    min: 320,
    max: 430,
  })
  const journeyHeight = Math.min(
    viewportHeight - scaleViewportValue(96, viewportWidth, viewportHeight, { min: 72, max: 120 }),
    scaleViewportValue(DEFAULT_JOURNEY_PANEL_HEIGHT, viewportWidth, viewportHeight, { min: 360, max: 520 })
  )

  return {
    appPadding,
    panelGap,
    minMapPanelWidth: scaleViewportValue(MIN_MAP_PANEL_WIDTH, viewportWidth, viewportHeight, { min: 340, max: 520 }),
    defaultGuideWidth: guideWidth,
    guidePanelInitialRect: {
      x: Math.max(viewportWidth - guideWidth - guideOffsetX, appPadding),
      y: guideTop,
      width: guideWidth,
      height: guideHeight,
    },
    knowledgePanelInitialRect: {
      x: Math.max(viewportWidth - knowledgeWidth - appPadding, appPadding),
      y: knowledgeTop,
      width: knowledgeWidth,
      height: knowledgeHeight,
    },
    voicePanelInitialRect: {
      x: Math.max(viewportWidth - voiceWidth - appPadding, appPadding),
      y: Math.min(
        knowledgeTop + knowledgeHeight + scaleViewportValue(20, viewportWidth, viewportHeight, { min: 14, max: 26 }),
        viewportHeight - voiceHeight - appPadding
      ),
      width: voiceWidth,
      height: voiceHeight,
    },
    journeyPanelInitialRect: {
      x: appPadding + scaleViewportValue(18, viewportWidth, viewportHeight, { min: 12, max: 28 }),
      y: viewportHeight - journeyHeight - appPadding,
      width: journeyWidth,
      height: journeyHeight,
    },
  }
}

function getFallbackOrigin(mapWidth) {
  return {
    x: (mapWidth ?? window.innerWidth) / 2,
    y: window.innerHeight / 2,
  }
}

function getMapPanelMetrics(viewportWidth, viewportHeight, guideRect, appMetrics) {
  const guideWidth = guideRect?.width ?? appMetrics.defaultGuideWidth
  const width = Math.max(
    appMetrics.minMapPanelWidth,
    viewportWidth - (appMetrics.appPadding * 2) - appMetrics.panelGap - guideWidth
  )
  const height = viewportHeight - (appMetrics.appPadding * 2)
  return { width, height }
}

function getMapPanelRect(viewportWidth, viewportHeight, guideRect, appMetrics) {
  const { width, height } = getMapPanelMetrics(viewportWidth, viewportHeight, guideRect, appMetrics)
  const guideCenter = guideRect ? (guideRect.x + guideRect.width / 2) : viewportWidth
  const placeOnRight = guideCenter < (viewportWidth / 2)

  return {
    x: placeOnRight ? viewportWidth - appMetrics.appPadding - width : appMetrics.appPadding,
    y: appMetrics.appPadding,
    width,
    height,
    side: placeOnRight ? 'right' : 'left',
  }
}

function rectEquals(a, b) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}

export default function App() {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const focusMetrics = getResponsiveFocusMetrics(viewportWidth, viewportHeight)
  const appMetrics = getResponsiveAppMetrics(viewportWidth, viewportHeight, focusMetrics)
  const [selectedNode, setSelectedNode] = useState(null)
  const [detailDismissing, setDetailDismissing] = useState(false)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [searchMatches, setSearchMatches] = useState(null)
  const [graphRef, setGraphRef] = useState(null)
  const mapAreaRef = useRef(null)
  const [mapViewport, setMapViewport] = useState({
    width: window.innerWidth - 40,
    height: window.innerHeight - 40,
    left: 18,
    top: 18,
  })
  const [viewMode, setViewMode] = useState('map')
  const [focusOrigin, setFocusOrigin] = useState(() => getFallbackOrigin(window.innerWidth - 40))
  const [guideEvent, setGuideEvent] = useState(null)
  const [activeLensId, setActiveLensId] = useState(null)
  const [committedGuideRect, setCommittedGuideRect] = useState(() => appMetrics.guidePanelInitialRect)
  const mapGuideRectRef = useRef(null)
  const pendingJourneyNodeRef = useRef(null)
  const transitionTimerRef = useRef(null)
  const focusModeActive = viewMode !== 'map'
  const focusLayoutActive = viewMode === 'focus' || viewMode === 'enteringFocus'

  function handleGuideInteractionEnd({ rect }) {
    if (viewMode === 'map') {
      const bounds = getViewportBounds(viewportWidth, viewportHeight, 16)
      const baseRect = clampPanelRect(rect, bounds, focusMetrics.guideMinSize)
      const mapPanelRect = getMapPanelRect(viewportWidth, viewportHeight, baseRect, appMetrics)
      const guideBounds = mapPanelRect.side === 'left'
        ? {
            ...bounds,
            minX: mapPanelRect.x + mapPanelRect.width + appMetrics.panelGap,
          }
        : {
            ...bounds,
            maxX: mapPanelRect.x - appMetrics.panelGap,
          }
      const nextRect = clampPanelRect(baseRect, guideBounds, focusMetrics.guideMinSize)
      setGuideRect(nextRect)
      setCommittedGuideRect(nextRect)
      return
    }

    const {
      guideRect: nextGuideRect,
      knowledgeRect: nextKnowledgeRect,
      voiceRect: nextVoiceRect,
    } = getFocusPanelLayout(
      viewportWidth,
      viewportHeight,
      rect,
      knowledgeRect,
      voiceRect
    )
    setGuideRect(nextGuideRect)
    setCommittedGuideRect(nextGuideRect)
    setKnowledgeRect(nextKnowledgeRect)
    setVoiceRect(nextVoiceRect)
  }

  function handleKnowledgeInteractionEnd({ rect }) {
    const {
      guideRect: nextGuideRect,
      knowledgeRect: nextKnowledgeRect,
      voiceRect: nextVoiceRect,
    } = getFocusPanelLayout(
      viewportWidth,
      viewportHeight,
      guideRect,
      rect,
      voiceRect
    )
    setGuideRect(nextGuideRect)
    setCommittedGuideRect(nextGuideRect)
    setKnowledgeRect(nextKnowledgeRect)
    setVoiceRect(nextVoiceRect)
  }

  function handleVoiceInteractionEnd({ rect }) {
    const {
      guideRect: nextGuideRect,
      knowledgeRect: nextKnowledgeRect,
      voiceRect: nextVoiceRect,
    } = getFocusPanelLayout(
      viewportWidth,
      viewportHeight,
      guideRect,
      knowledgeRect,
      rect
    )
    setGuideRect(nextGuideRect)
    setCommittedGuideRect(nextGuideRect)
    setKnowledgeRect(nextKnowledgeRect)
    setVoiceRect(nextVoiceRect)
  }

  const floatingGuidePanel = useFloatingPanel({
    enabled: true,
    initialRect: appMetrics.guidePanelInitialRect,
    minSize: focusMetrics.guideMinSize,
    resetKey: 'guide-panel',
    onInteractionEnd: handleGuideInteractionEnd,
  })

  const floatingKnowledgePanel = useFloatingPanel({
    enabled: focusModeActive,
    initialRect: appMetrics.knowledgePanelInitialRect,
    minSize: focusMetrics.knowledgeMinSize,
    resetKey: `${selectedNode?.id ?? 'none'}:${viewMode}`,
    onInteractionEnd: handleKnowledgeInteractionEnd,
  })

  const floatingVoicePanel = useFloatingPanel({
    enabled: focusModeActive,
    initialRect: appMetrics.voicePanelInitialRect,
    minSize: focusMetrics.narrationMinSize,
    resetKey: `${selectedNode?.id ?? 'none'}:${viewMode}:voice`,
    onInteractionEnd: handleVoiceInteractionEnd,
  })

  const guideRect = floatingGuidePanel.rect
  const setGuideRect = floatingGuidePanel.setRect
  const knowledgeRect = floatingKnowledgePanel.rect
  const setKnowledgeRect = floatingKnowledgePanel.setRect
  const voiceRect = floatingVoicePanel.rect
  const setVoiceRect = floatingVoicePanel.setRect
  const guideRectForLayout = floatingGuidePanel.isInteracting ? committedGuideRect : guideRect
  const mapPanelRect = useMemo(() => (
    getMapPanelRect(viewportWidth, viewportHeight, guideRectForLayout, appMetrics)
  ), [appMetrics, guideRectForLayout, viewportHeight, viewportWidth])
  const focusLayout = useMemo(() => (
    focusLayoutActive
      ? getFocusPanelLayout(
          viewportWidth,
          viewportHeight,
          guideRect,
          knowledgeRect,
          voiceRect
        )
      : null
  ), [
    focusLayoutActive,
    guideRect,
    knowledgeRect,
    viewportHeight,
    viewportWidth,
    voiceRect,
  ])

  useLayoutEffect(() => {
    if (!focusLayoutActive || !focusLayout) return

    const {
      guideRect: nextGuideRect,
      knowledgeRect: nextKnowledgeRect,
      voiceRect: nextVoiceRect,
    } = focusLayout

    if (!rectEquals(guideRect, nextGuideRect)) {
      setGuideRect(nextGuideRect)
    }

    if (!rectEquals(knowledgeRect, nextKnowledgeRect)) {
      setKnowledgeRect(nextKnowledgeRect)
    }

    if (!rectEquals(voiceRect, nextVoiceRect)) {
      setVoiceRect(nextVoiceRect)
    }
  }, [
    focusLayout,
    focusLayoutActive,
    guideRect,
    knowledgeRect,
    voiceRect,
    setGuideRect,
    setKnowledgeRect,
    setVoiceRect,
  ])

  useLayoutEffect(() => {
    if (!mapAreaRef.current) return

    const updateViewport = () => {
      const { clientWidth, clientHeight } = mapAreaRef.current
      const { left, top } = mapAreaRef.current.getBoundingClientRect()
      setMapViewport({
        width: clientWidth,
        height: clientHeight,
        left,
        top,
      })
    }

    updateViewport()

    const observer = new ResizeObserver(updateViewport)
    observer.observe(mapAreaRef.current)
    return () => observer.disconnect()
  }, [])

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearTransitionTimer(), [clearTransitionTimer])

  const getGraphNode = useCallback((node) => {
    if (!node) return null
    if (!graphRef || typeof graphRef.graphData !== 'function') return node
    return graphRef.graphData().nodes.find(candidate => candidate.id === node.id) ?? node
  }, [graphRef])

  const selectNodeInMap = useCallback((node, zoom = 2) => {
    const activeNode = getGraphNode(node)
    if (!activeNode) return

    setHoveredNode(null)
    setSelectedNode(activeNode)

    if (graphRef && activeNode.x != null && activeNode.y != null) {
      graphRef.centerAt(activeNode.x, activeNode.y, 500)
      graphRef.zoom(zoom, 500)
    }
  }, [getGraphNode, graphRef])

  const getNodeOrigin = useCallback((node) => {
    if (graphRef && node?.x != null && node?.y != null) {
      const coords = graphRef.graph2ScreenCoords(node.x, node.y)
      if (Number.isFinite(coords.x) && Number.isFinite(coords.y)) {
        return { x: coords.x, y: coords.y }
      }
    }
    return {
      x: mapViewport.width / 2,
      y: mapViewport.height / 2,
    }
  }, [graphRef, mapViewport.height, mapViewport.width])

  const enterFocusMode = useCallback((node, options = {}) => {
    const activeNode = getGraphNode(node)
    if (!activeNode) return
    const { silent = false } = options

    mapGuideRectRef.current = guideRect
    clearTransitionTimer()
    setSelectedNode(activeNode)
    setHoveredNode(null)
    setActiveLensId(activeNode.type === 'mission' ? 'mission-role' : 'discovery')
    setFocusOrigin(getNodeOrigin(activeNode))
    setViewMode('enteringFocus')
    if (!silent) {
      setGuideEvent({
        id: Date.now(),
        type: 'local-stella',
        text: `Let's take a closer look at ${activeNode.name}.`,
      })
    }

    if (graphRef && activeNode.x != null && activeNode.y != null) {
      const currentZoom = typeof graphRef.zoom === 'function' ? graphRef.zoom() : 1
      graphRef.centerAt(activeNode.x, activeNode.y, FOCUS_ENTER_MS)
      graphRef.zoom(Math.max(currentZoom, 1.7), FOCUS_ENTER_MS)
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setViewMode('focus')
      transitionTimerRef.current = null
    }, FOCUS_ENTER_MS)
  }, [clearTransitionTimer, getGraphNode, getNodeOrigin, graphRef, guideRect])

  const exitFocusMode = useCallback(() => {
    if (viewMode === 'map') return

    clearTransitionTimer()
    setActiveLensId(null)
    setViewMode('exitingFocus')

    if (mapGuideRectRef.current) {
      setGuideRect(mapGuideRectRef.current)
      setCommittedGuideRect(mapGuideRectRef.current)
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setViewMode('map')
      transitionTimerRef.current = null
    }, FOCUS_EXIT_MS)
  }, [clearTransitionTimer, setGuideRect, viewMode])

  const centerJourneyNode = useCallback((node) => {
    const activeNode = getGraphNode(node)
    if (!activeNode) return

    if (viewMode !== 'map') {
      pendingJourneyNodeRef.current = activeNode
      exitFocusMode()
      return
    }

    selectNodeInMap(activeNode)
  }, [exitFocusMode, getGraphNode, selectNodeInMap, viewMode])

  useEffect(() => {
    if (viewMode !== 'map' || !pendingJourneyNodeRef.current) return

    const pendingNode = pendingJourneyNodeRef.current
    pendingJourneyNodeRef.current = null

    window.requestAnimationFrame(() => {
      selectNodeInMap(pendingNode)
    })
  }, [selectNodeInMap, viewMode])

  useEffect(() => {
    if (viewMode === 'map') return

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        exitFocusMode()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [exitFocusMode, viewMode])

  const handleNodeClick = useCallback((node) => {
    enterFocusMode(node)
  }, [enterFocusMode])

  const dismissDetailPanel = useCallback(() => {
    if (!selectedNode || viewMode !== 'map' || detailDismissing) return
    setDetailDismissing(true)
    setTimeout(() => {
      setSelectedNode(null)
      setDetailDismissing(false)
    }, 220)
  }, [selectedNode, viewMode, detailDismissing])

  const handleBackgroundClick = useCallback(() => {
    if (viewMode !== 'map') return
    if (selectedNode) {
      dismissDetailPanel()
    }
  }, [viewMode, selectedNode, dismissDetailPanel])

  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchMatches(null)
      return
    }
    const q = query.toLowerCase()
    const matches = new Set(
      nodes.filter(n => n.name.toLowerCase().includes(q)).map(n => n.id)
    )
    setSearchMatches(matches.size > 0 ? matches : new Set())

    if (matches.size === 1 && graphRef) {
      const matchId = [...matches][0]
      const node = nodes.find(n => n.id === matchId)
      const activeNode = getGraphNode(node)
      if (activeNode?.x != null && activeNode?.y != null) {
        selectNodeInMap(activeNode)
      }
    }
  }, [getGraphNode, graphRef, selectNodeInMap])

  const focusNeighbors = useMemo(() => {
    if (!selectedNode) return []
    const neighborIds = getNeighborIds(selectedNode.id)
    return nodes.filter(node => neighborIds.has(node.id))
  }, [selectedNode])

  const focusLenses = useMemo(() => (
    selectedNode ? getFocusLenses(selectedNode, focusNeighbors) : []
  ), [focusNeighbors, selectedNode])

  const activeLens = useMemo(
    () => focusLenses.find(l => l.id === activeLensId) ?? null,
    [focusLenses, activeLensId]
  )

  const [journeyPanelOpen, setJourneyPanelOpen] = useState(false)

  const {
    journey,
    currentNode: currentJourneyNode,
    recommendations: journeyRecommendations,
    start: startJourney,
    continueTo: continueJourneyTo,
    pause: pauseJourney,
    resume: resumeJourney,
    restart: restartJourney,
    markVisited: markJourneyVisited,
    setCurrentFromNode: setJourneyCurrentFromNode,
    canSetCurrentFromNode: canSetJourneyCurrentFromNode,
  } = useGuidedJourney({
    nodes,
    links,
    setSelectedNode,
    centerOnNode: centerJourneyNode,
    panelOpen: journeyPanelOpen,
  })
  const journeyRunning = journey.status === 'active' || journey.status === 'paused'
  const showJourneyPanel = journeyPanelOpen

  const handleStartJourney = useCallback(() => {
    startJourney()
    setJourneyPanelOpen(true)
  }, [startJourney])

  const handleResumeJourney = useCallback(() => {
    resumeJourney()
    setJourneyPanelOpen(true)
  }, [resumeJourney])

  const handleRestartJourney = useCallback(() => {
    restartJourney()
    setJourneyPanelOpen(true)
  }, [restartJourney])

  const handleContinueJourney = useCallback((nodeId) => {
    continueJourneyTo(nodeId)
  }, [continueJourneyTo])

  const handleDiveDeeper = useCallback(() => {
    if (!currentJourneyNode) return
    enterFocusMode(currentJourneyNode)
  }, [currentJourneyNode, enterFocusMode])

  const journeyCandidateNode = useMemo(() => {
    if (!selectedNode) return null
    if (!canSetJourneyCurrentFromNode(selectedNode.id)) return null
    return selectedNode
  }, [canSetJourneyCurrentFromNode, selectedNode])
  const floatingJourneyPanel = useFloatingPanel({
    enabled: showJourneyPanel,
    initialRect: appMetrics.journeyPanelInitialRect,
    minSize: { width: 320, height: 360 },
    resetKey: 'journey-panel',
  })

  const handleLensAsk = useCallback((lens) => {
    setGuideEvent({
      id: Date.now(),
      type: 'prompt-stella',
      prompt: lens.prompt,
      displayText: `Tell me more about ${lens.title.toLowerCase()}`,
    })
  }, [])

  const mapAreaStyle = useMemo(() => (
    viewMode === 'map'
      ? {
          position: 'absolute',
          left: `${mapPanelRect.x}px`,
          top: `${mapPanelRect.y}px`,
          width: `${mapPanelRect.width}px`,
          height: `${mapPanelRect.height}px`,
        }
      : {
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: `${viewportWidth}px`,
          height: `${viewportHeight}px`,
        }
  ), [mapPanelRect, viewMode, viewportHeight, viewportWidth])

  return (
    <div className="app-layout">
      <div
        ref={mapAreaRef}
        className={`map-area map-area--${viewMode}`}
        style={mapAreaStyle}
      >
        <BrainMap
          selectedNode={selectedNode}
          hoveredNode={hoveredNode}
          searchMatches={searchMatches}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredNode}
          onBackgroundClick={handleBackgroundClick}
          onGraphReady={setGraphRef}
          width={mapViewport.width}
          height={mapViewport.height}
          presentationMode={viewMode}
          occlusionRect={null}
        />
        {viewMode === 'map' && (
          <SearchBar
            onSearch={handleSearch}
            onSelect={enterFocusMode}
            searchMatches={searchMatches}
            nodes={nodes}
            onJourneyOpen={() => setJourneyPanelOpen(true)}
            journeyActive={journeyRunning}
          />
        )}
        {selectedNode && viewMode === 'map' && (
          <DetailPanel
            node={selectedNode}
            graphRef={graphRef}
            onClose={dismissDetailPanel}
            closing={detailDismissing}
            maxX={mapViewport.width}
            maxY={mapViewport.height}
          />
        )}
        {selectedNode && viewMode !== 'map' && (
          <FocusMode
            key={selectedNode.id}
            node={selectedNode}
            neighbors={focusNeighbors}
            lenses={focusLenses}
            phase={viewMode}
            origin={focusOrigin}
            renderRect={focusLayout?.renderRect ?? null}
            onBack={exitFocusMode}
            onAskStella={handleLensAsk}
            selectedLensId={activeLensId}
            onLensSelect={setActiveLensId}
            panelStyle={floatingKnowledgePanel.style}
            onPanelDragStart={floatingKnowledgePanel.onDragStart}
            onPanelResizeStart={floatingKnowledgePanel.onResizeStart}
            panelInteracting={floatingKnowledgePanel.isInteracting}
            voicePanelStyle={floatingVoicePanel.style}
            onVoicePanelDragStart={floatingVoicePanel.onDragStart}
            onVoicePanelResizeStart={floatingVoicePanel.onResizeStart}
            voicePanelInteracting={floatingVoicePanel.isInteracting}
          />
        )}
      </div>
      <GuidePanel
        selectedNode={selectedNode}
        guideEvent={guideEvent}
        autoCommentEnabled={viewMode === 'map' && !journeyRunning}
        focusModeActive={focusModeActive}
        activeLens={activeLens}
        journeyStatus={journey.status}
        onStartJourney={handleStartJourney}
        onResumeJourney={handleResumeJourney}
        onRestartJourney={handleRestartJourney}
        floating={true}
        floatingStyle={floatingGuidePanel.style}
        onDragStart={floatingGuidePanel.onDragStart}
        onResizeStart={floatingGuidePanel.onResizeStart}
        isInteracting={floatingGuidePanel.isInteracting}
      />
      {showJourneyPanel && (
        <JourneyPanel
          journey={journey}
          currentNode={currentJourneyNode}
          recommendations={journeyRecommendations}
          onStartJourney={handleStartJourney}
          onContinueJourney={handleContinueJourney}
          onContinueToNode={continueJourneyTo}
          onPauseJourney={pauseJourney}
          onResumeJourney={handleResumeJourney}
          onRestartJourney={handleRestartJourney}
          onClose={() => setJourneyPanelOpen(false)}
          onMarkJourneyVisited={markJourneyVisited}
          onDiveDeeper={handleDiveDeeper}
          onSetJourneyCurrentFromNode={setJourneyCurrentFromNode}
          candidateNode={journeyCandidateNode}
          floating={true}
          floatingStyle={floatingJourneyPanel.style}
          onDragStart={floatingJourneyPanel.onDragStart}
          onResizeStart={floatingJourneyPanel.onResizeStart}
          isInteracting={floatingJourneyPanel.isInteracting}
        />
      )}
    </div>
  )
}
