import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceCollide } from 'd3-force'
import { nodes as sourceNodes, links as sourceLinks, getNeighborIds } from '../data/graph-data'
import { drawNode, drawLink, drawStars, drawNebulae, drawSceneStructure } from '../utils/render-helpers'
import { assignSpiralPositions, assignLinkOrbitMetrics, forceSpiralShape } from '../utils/spiral-layout'
import { buildGraphSceneDetails } from '../utils/graph-scene'
import { getSafeViewportCenter } from '../utils/floating-panels'

function cloneGraphData() {
  const data = {
    nodes: sourceNodes.map(n => ({ ...n })),
    links: sourceLinks.map(l => ({ ...l })),
  }
  assignSpiralPositions(data.nodes, data.links)
  assignLinkOrbitMetrics(data.nodes, data.links)
  return data
}

export default function BrainMap({
  selectedNode,
  visitedNodeIds = [],
  hoveredNode,
  searchMatches,
  onNodeClick,
  onNodeHover,
  onBackgroundClick,
  onGraphReady,
  width,
  height,
  presentationMode = 'map',
  occlusionRect = null,
}) {
  const fgRef = useRef()
  const [graphData] = useState(cloneGraphData)
  const sceneDetails = useMemo(
    () => buildGraphSceneDetails(graphData.nodes, graphData.links),
    [graphData.links, graphData.nodes]
  )
  const nodeMap = useMemo(
    () => new Map(graphData.nodes.map(n => [n.id, n])),
    [graphData.nodes]
  )
  const visitedNodeIdSet = useMemo(
    () => new Set(visitedNodeIds),
    [visitedNodeIds]
  )
  const isMapMode = presentationMode === 'map'

  useEffect(() => {
    if (fgRef.current) {
      onGraphReady(fgRef.current)

      // Configure d3-force for spiral galaxy shape
      fgRef.current.d3Force('charge').strength(-26)
      fgRef.current.d3Force('link').distance((link) => link.idealDistance ?? 24)
      fgRef.current.d3Force('link').strength(0.22)
      fgRef.current.d3Force('center', null)
      fgRef.current.d3Force('x', null)
      fgRef.current.d3Force('y', null)
      fgRef.current.d3Force('collide', forceCollide(7))
      fgRef.current.d3Force('spiral', forceSpiralShape(graphData.nodes, 1.1))

      // Zoom to fit after physics settles
      setTimeout(() => {
        fgRef.current?.zoomToFit(600, 60)
      }, 800)
    }
  }, [graphData.nodes, onGraphReady])

  // Pause/resume animation based on focus mode
  useEffect(() => {
    if (!fgRef.current) return
    if (presentationMode === 'enteringFocus' || presentationMode === 'focus') {
      fgRef.current.pauseAnimation()
    } else {
      fgRef.current.resumeAnimation()
    }
  }, [presentationMode])

  useEffect(() => {
    if (!fgRef.current || !isMapMode) return
    if (typeof fgRef.current.screen2GraphCoords !== 'function') return

    const viewportWidth = width ?? window.innerWidth
    const safeCenter = getSafeViewportCenter(viewportWidth, height, occlusionRect, 28)
    const mirrorPoint = fgRef.current.screen2GraphCoords(
      viewportWidth - safeCenter.x,
      height - safeCenter.y
    )

    if (!Number.isFinite(mirrorPoint.x) || !Number.isFinite(mirrorPoint.y)) return
    fgRef.current.centerAt(mirrorPoint.x, mirrorPoint.y, 250)
  }, [height, isMapMode, occlusionRect, width])

  // Compute neighbor set for selected node
  const selectedNeighbors = useMemo(() => {
    if (!selectedNode || !isMapMode) return null
    const neighbors = new Set(getNeighborIds(selectedNode.id))
    neighbors.add(selectedNode.id)
    return neighbors
  }, [isMapMode, selectedNode])

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isSelected = isMapMode && selectedNode?.id === node.id
    const isVisited = visitedNodeIdSet.has(node.id)
    const isNeighbor = selectedNeighbors?.has(node.id) && !isSelected
    const isDimmed =
      (selectedNeighbors && !selectedNeighbors.has(node.id)) ||
      (searchMatches && !searchMatches.has(node.id))
    const isHovered = hoveredNode?.id === node.id

    drawNode(ctx, node, globalScale, { isSelected, isVisited, isNeighbor, isDimmed, isHovered })
  }, [hoveredNode, isMapMode, searchMatches, selectedNeighbors, selectedNode, visitedNodeIdSet])

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    const isHighlighted =
      isMapMode &&
      selectedNode &&
      (sourceId === selectedNode.id || targetId === selectedNode.id)
    const isDimmed = selectedNeighbors && !isHighlighted

    drawLink(ctx, link, globalScale, { isHighlighted, isDimmed })
  }, [isMapMode, selectedNeighbors, selectedNode])

  const onRenderFramePre = useCallback((ctx, globalScale) => {
    drawStars(ctx, globalScale)
    drawNebulae(ctx)
    drawSceneStructure(ctx, graphData.nodes, sceneDetails, globalScale, {
      selectedNodeId: selectedNode?.id ?? null,
      nodeMap,
    })
  }, [graphData.nodes, nodeMap, sceneDetails, selectedNode?.id])

  const nodePointerAreaPaint = useCallback((node, color, ctx, globalScale) => {
    const r = (node.type === 'mission' ? 12 : 8) / globalScale
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
    ctx.fill()
  }, [])

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={width ?? window.innerWidth}
      height={height ?? window.innerHeight}
      backgroundColor="#06080d"
      nodeCanvasObject={nodeCanvasObject}
      nodeCanvasObjectMode={() => 'replace'}
      nodePointerAreaPaint={nodePointerAreaPaint}
      linkCanvasObject={linkCanvasObject}
      linkCanvasObjectMode={() => 'replace'}
      onNodeClick={onNodeClick}
      onNodeHover={onNodeHover}
      onBackgroundClick={onBackgroundClick}
      onRenderFramePre={onRenderFramePre}
      cooldownTicks={100}
      warmupTicks={50}
      enableNodeDrag={isMapMode}
      enablePanInteraction={isMapMode}
      enableZoomInteraction={isMapMode}
      enablePointerInteraction={isMapMode}
      nodeVal={node => node.type === 'mission' ? 4 : 1}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
    />
  )
}
