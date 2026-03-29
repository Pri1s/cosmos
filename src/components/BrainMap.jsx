import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { forceX, forceY, forceCollide } from 'd3-force'
import { nodes as sourceNodes, links as sourceLinks, getNeighborIds } from '../data/graph-data'
import { drawNode, drawLink, drawStars, drawNebulae } from '../utils/render-helpers'
import { assignSpiralPositions, forceSpiralShape } from '../utils/spiral-layout'

function cloneGraphData() {
  const data = {
    nodes: sourceNodes.map(n => ({ ...n })),
    links: sourceLinks.map(l => ({ ...l })),
  }
  assignSpiralPositions(data.nodes, data.links)
  return data
}

export default function BrainMap({
  selectedNode,
  hoveredNode,
  searchMatches,
  onNodeClick,
  onNodeHover,
  onBackgroundClick,
  onGraphReady,
}) {
  const fgRef = useRef()
  const [graphData] = useState(cloneGraphData)
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (fgRef.current) {
      onGraphReady(fgRef.current)

      // Configure d3-force for spiral galaxy shape
      fgRef.current.d3Force('charge').strength(-30)
      fgRef.current.d3Force('link').distance(20)
      fgRef.current.d3Force('center', null)
      fgRef.current.d3Force('x', null)
      fgRef.current.d3Force('y', null)
      fgRef.current.d3Force('collide', forceCollide(8))
      fgRef.current.d3Force('spiral', forceSpiralShape(graphData.nodes))

      // Zoom to fit after physics settles
      setTimeout(() => {
        fgRef.current?.zoomToFit(600, 60)
      }, 800)
    }
  }, [onGraphReady])

  // Compute neighbor set for selected node
  const selectedNeighbors = useMemo(() => {
    if (!selectedNode) return null
    const neighbors = new Set(getNeighborIds(selectedNode.id))
    neighbors.add(selectedNode.id)
    return neighbors
  }, [selectedNode])

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const isSelected = selectedNode?.id === node.id
    const isNeighbor = selectedNeighbors?.has(node.id) && !isSelected
    const isDimmed =
      (selectedNeighbors && !selectedNeighbors.has(node.id)) ||
      (searchMatches && !searchMatches.has(node.id))
    const isHovered = hoveredNode?.id === node.id

    drawNode(ctx, node, globalScale, { isSelected, isNeighbor, isDimmed, isHovered })
  }, [selectedNode, selectedNeighbors, hoveredNode, searchMatches])

  const linkCanvasObject = useCallback((link, ctx, globalScale) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    const isHighlighted = selectedNode && (sourceId === selectedNode.id || targetId === selectedNode.id)
    const isDimmed = selectedNeighbors && !isHighlighted

    drawLink(ctx, link, globalScale, { isHighlighted, isDimmed })
  }, [selectedNode, selectedNeighbors])

  const onRenderFramePre = useCallback((ctx, globalScale) => {
    drawStars(ctx, globalScale)
    drawNebulae(ctx, globalScale)
  }, [])

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
      width={dimensions.width}
      height={dimensions.height}
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
      enableNodeDrag={true}
      nodeVal={node => node.type === 'mission' ? 4 : 1}
      d3AlphaDecay={0.02}
      d3VelocityDecay={0.3}
    />
  )
}
