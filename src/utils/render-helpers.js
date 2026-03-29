const COLORS = {
  exoplanet: '#5ec4f7',
  mission: '#f76e5e',
}

// Pre-computed RGB channel strings to avoid hex→rgb conversion in the render loop
const COLORS_RGB = {
  exoplanet: '94, 196, 247',
  mission: '247, 110, 94',
}

const NODE_RADIUS = { exoplanet: 5, mission: 9 }

const _SPREAD = 2000

// Pre-generate star field once
let _stars = null
export function getStars(count = 300, spread = _SPREAD) {
  if (_stars) return _stars
  _stars = Array.from({ length: count }, (_, i) => ({
    x: (Math.random() - 0.5) * spread,
    y: (Math.random() - 0.5) * spread,
    brightness: 0.2 + Math.random() * 0.6,
    size: 0.3 + Math.random() * 1.2,
    twinkleOffset: i * 1.7,
  }))
  return _stars
}

// Off-screen canvas for stars — redrawn every N frames for twinkling
let _starsCanvas = null
let _starsCtx = null
let _starsFrameCount = 0
let _starsNeedsInit = true

function ensureStarsCanvas() {
  if (_starsCanvas) return
  _starsCanvas = document.createElement('canvas')
  _starsCanvas.width = _SPREAD
  _starsCanvas.height = _SPREAD
  _starsCtx = _starsCanvas.getContext('2d')
}

function redrawStarsCanvas(globalScale) {
  const ctx = _starsCtx
  const cx = _SPREAD / 2
  ctx.clearRect(0, 0, _SPREAD, _SPREAD)
  const stars = getStars()
  const now = Date.now()
  for (const star of stars) {
    const twinkle = 0.7 + 0.3 * Math.sin(now / 3000 + star.twinkleOffset)
    const alpha = star.brightness * twinkle
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(cx + star.x, cx + star.y, star.size / globalScale, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawStars(ctx, globalScale) {
  ensureStarsCanvas()
  _starsFrameCount++
  if (_starsNeedsInit || _starsFrameCount % 4 === 0) {
    redrawStarsCanvas(globalScale)
    _starsNeedsInit = false
  }
  ctx.drawImage(_starsCanvas, -_SPREAD / 2, -_SPREAD / 2, _SPREAD, _SPREAD)
}

// Off-screen canvas for nebulae — drawn once (fully static)
let _nebulaCanvas = null

function getNebulaCanvas() {
  if (_nebulaCanvas) return _nebulaCanvas
  const canvas = document.createElement('canvas')
  canvas.width = _SPREAD
  canvas.height = _SPREAD
  const ctx = canvas.getContext('2d')
  const cx = _SPREAD / 2

  // Galactic core glow at center
  const core = ctx.createRadialGradient(cx, cx, 0, cx, cx, 120)
  core.addColorStop(0, 'rgba(180, 160, 220, 0.06)')
  core.addColorStop(0.4, 'rgba(120, 100, 180, 0.03)')
  core.addColorStop(1, 'rgba(60, 40, 100, 0)')
  ctx.fillStyle = core
  ctx.fillRect(cx - 120, cx - 120, 240, 240)

  // Spiral arm nebulae — positioned along the arms
  const nebulae = [
    { x: -120, y: -80, r: 300, color: [80, 50, 160] },
    { x: 150, y: 120, r: 280, color: [40, 100, 140] },
    { x: -60, y: 180, r: 250, color: [100, 40, 100] },
    { x: 100, y: -150, r: 200, color: [60, 80, 140] },
  ]
  for (const n of nebulae) {
    const px = cx + n.x
    const py = cx + n.y
    const grad = ctx.createRadialGradient(px, py, 0, px, py, n.r)
    grad.addColorStop(0, `rgba(${n.color.join(',')}, 0.03)`)
    grad.addColorStop(0.5, `rgba(${n.color.join(',')}, 0.015)`)
    grad.addColorStop(1, `rgba(${n.color.join(',')}, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(px - n.r, py - n.r, n.r * 2, n.r * 2)
  }

  _nebulaCanvas = canvas
  return canvas
}

export function drawNebulae(ctx) {
  ctx.drawImage(getNebulaCanvas(), -_SPREAD / 2, -_SPREAD / 2, _SPREAD, _SPREAD)
}

function getClusterRadius(missionNode, memberNodes) {
  if (memberNodes.length === 0) return 18

  const distances = memberNodes.map((node) => Math.hypot(node.x - missionNode.x, node.y - missionNode.y))
  const averageDistance = distances.reduce((sum, value) => sum + value, 0) / distances.length
  const furthestDistance = Math.max(...distances)
  return Math.max(averageDistance * 0.86, furthestDistance * 0.58, 20)
}

function drawCurvedStroke(ctx, source, target, globalScale, {
  alpha,
  width,
  color,
  curveScale = 0.14,
  curveBias = 1,
}) {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const mx = (source.x + target.x) / 2
  const my = (source.y + target.y) / 2
  const dist = Math.hypot(dx, dy)
  const offset = Math.min(dist * curveScale, 34) * curveBias
  const nx = -dy / (dist || 1)
  const ny = dx / (dist || 1)
  const cpx = mx + nx * offset
  const cpy = my + ny * offset

  ctx.strokeStyle = typeof color === 'string'
    ? (color.includes('rgba') ? color : `rgba(${color}, ${alpha})`)
    : color
  ctx.lineWidth = width / globalScale
  ctx.beginPath()
  ctx.moveTo(source.x, source.y)
  ctx.quadraticCurveTo(cpx, cpy, target.x, target.y)
  ctx.stroke()
}

/**
 * @param {Map} [nodeMap] - Pre-built id→node map. If omitted, built from nodes array.
 */
export function drawSceneStructure(ctx, nodes, sceneDetails, globalScale, { selectedNodeId, nodeMap: providedNodeMap } = {}) {
  if (!sceneDetails) return

  const nodeMap = providedNodeMap ?? new Map(nodes.map((node) => [node.id, node]))

  for (const bridge of sceneDetails.bridgeLinks) {
    const sourceNode = nodeMap.get(bridge.sourceId)
    const targetNode = nodeMap.get(bridge.targetId)
    if (!sourceNode || !targetNode) continue

    const gradient = ctx.createLinearGradient(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y)
    gradient.addColorStop(0, 'rgba(247, 110, 94, 0.08)')
    gradient.addColorStop(0.45, 'rgba(181, 149, 175, 0.06)')
    gradient.addColorStop(1, 'rgba(94, 196, 247, 0.08)')

    drawCurvedStroke(ctx, sourceNode, targetNode, globalScale, {
      alpha: 0.08,
      width: 1.8,
      color: gradient,
      curveScale: bridge.curveScale,
      curveBias: 1,
    })
  }

  for (const cluster of sceneDetails.clusters) {
    const missionNode = nodeMap.get(cluster.missionId)
    const memberNodes = cluster.memberIds
      .map((memberId) => nodeMap.get(memberId))
      .filter((node) => Number.isFinite(node?.x) && Number.isFinite(node?.y))

    if (!missionNode || memberNodes.length === 0) continue

    const isActive = cluster.missionId === selectedNodeId || cluster.memberIds.includes(selectedNodeId)
    const clusterRadius = getClusterRadius(missionNode, memberNodes)
    const haloRadius = clusterRadius * 1.85
    const halo = ctx.createRadialGradient(
      missionNode.x,
      missionNode.y,
      clusterRadius * 0.3,
      missionNode.x,
      missionNode.y,
      haloRadius
    )
    halo.addColorStop(0, `rgba(94, 196, 247, ${isActive ? 0.08 : 0.045})`)
    halo.addColorStop(0.6, 'rgba(94, 196, 247, 0.018)')
    halo.addColorStop(1, 'rgba(94, 196, 247, 0)')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(missionNode.x, missionNode.y, haloRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.setLineDash([10 / globalScale, 8 / globalScale])
    for (let ringIndex = 0; ringIndex < cluster.ringCount; ringIndex += 1) {
      const ringRadius = clusterRadius + (ringIndex * 9)
      const startAngle = ((cluster.arcSeed % 360) * Math.PI / 180) + (ringIndex * 0.45)
      const sweep = Math.PI * (1.08 + ((cluster.arcSeed + ringIndex) % 5) * 0.08)

      ctx.strokeStyle = `rgba(94, 196, 247, ${isActive ? 0.26 : 0.11})`
      ctx.lineWidth = (1 + (ringIndex * 0.22)) / globalScale
      ctx.beginPath()
      ctx.arc(missionNode.x, missionNode.y, ringRadius, startAngle, startAngle + sweep)
      ctx.stroke()
    }
    ctx.restore()
  }

  for (const mesh of sceneDetails.meshLinks) {
    const sourceNode = nodeMap.get(mesh.sourceId)
    const targetNode = nodeMap.get(mesh.targetId)
    if (!sourceNode || !targetNode) continue

    const dx = targetNode.x - sourceNode.x
    const dy = targetNode.y - sourceNode.y
    const distance = Math.hypot(dx, dy)
    if (distance > 90) continue

    drawCurvedStroke(ctx, sourceNode, targetNode, globalScale, {
      alpha: mesh.strength * 0.16,
      width: 0.9,
      color: '94, 196, 247',
      curveScale: 0.08,
      curveBias: Math.round(mesh.strength * 100) % 2 === 0 ? 1 : -1,
    })
  }
}

export function shouldDrawNodeLabel(node, globalScale, {
  isSelected = false,
  isNeighbor = false,
  isHovered = false,
} = {}) {
  if (isSelected || isHovered) return true

  if (node.type === 'mission') {
    return globalScale > 1.02
  }

  if (isNeighbor) {
    return globalScale > 1.85
  }

  return globalScale > 2.5
}

export function drawNode(ctx, node, globalScale, {
  isSelected,
  isVisited,
  isNeighbor,
  isDimmed,
  isHovered,
}) {
  if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return

  const rgb = COLORS_RGB[node.type]
  const baseR = NODE_RADIUS[node.type]
  const r = baseR / globalScale

  // Compute opacity
  let opacity = 1
  if (isDimmed) opacity = 0.12

  // Outer glow
  const glowR = r * (isHovered ? 4.5 : isSelected ? 4 : isVisited ? 3.4 : 3)
  const glowAlpha = (isHovered ? 0.25 : isSelected ? 0.22 : isVisited ? 0.16 : 0.12) * opacity
  const grad = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, glowR)
  grad.addColorStop(0, `rgba(${rgb}, ${glowAlpha})`)
  grad.addColorStop(1, `rgba(${rgb}, 0)`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2)
  ctx.fill()

  // Pulsing ring for selected node
  if (isSelected) {
    const pulseAlpha = 0.4 + 0.15 * Math.sin(Date.now() / 400)
    ctx.strokeStyle = `rgba(${rgb}, ${pulseAlpha * opacity})`
    ctx.lineWidth = 1.5 / globalScale
    ctx.beginPath()
    ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (isVisited && !isSelected) {
    const visitedRingOpacity = isDimmed ? 0.18 : isHovered ? 0.34 : 0.26
    ctx.strokeStyle = `rgba(${rgb}, ${visitedRingOpacity})`
    ctx.lineWidth = 0.95 / globalScale
    ctx.beginPath()
    ctx.arc(node.x, node.y, r * 1.85, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Main fill
  const fillAlpha = isVisited && !isDimmed ? 0.98 : 0.9
  ctx.fillStyle = `rgba(${rgb}, ${fillAlpha * opacity})`
  ctx.beginPath()
  ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
  ctx.fill()

  // Mission double-ring
  if (node.type === 'mission') {
    const missionRingAlpha = isVisited && !isSelected ? 0.64 : 0.5
    ctx.strokeStyle = `rgba(${rgb}, ${missionRingAlpha * opacity})`
    ctx.lineWidth = 0.8 / globalScale
    ctx.beginPath()
    ctx.arc(node.x, node.y, r * 1.5, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Specular highlight
  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * opacity})`
  ctx.beginPath()
  ctx.arc(node.x - r * 0.25, node.y - r * 0.25, r * 0.25, 0, Math.PI * 2)
  ctx.fill()

  // Label
  const showLabel = shouldDrawNodeLabel(node, globalScale, {
    isSelected,
    isNeighbor,
    isHovered,
  })
  if (showLabel) {
    const isMission = node.type === 'mission'
    const fontSize = Math.max(3, ((isSelected || isHovered) ? 11 : isMission ? 9.5 : 8) / globalScale)
    const labelAlpha = (
      (isSelected || isHovered)
        ? 1
        : isMission
          ? 0.74
          : isNeighbor
            ? 0.58
            : 0.42
    ) * opacity
    ctx.font = `${fontSize}px 'DM Mono', monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Text glow
    ctx.fillStyle = `rgba(${rgb}, ${0.3 * labelAlpha})`
    ctx.fillText(node.name, node.x, node.y + r + 3 / globalScale)

    // Text
    ctx.fillStyle = `rgba(232, 232, 232, ${labelAlpha})`
    ctx.fillText(node.name, node.x, node.y + r + 3 / globalScale)
  }
}

export function drawLink(ctx, link, globalScale, { isHighlighted, isDimmed }) {
  const source = link.source
  const target = link.target

  if (!Number.isFinite(source.x) || !Number.isFinite(target.x)) return

  let alpha = 0.18
  let width = 0.8
  let color = '160, 180, 200'

  if (isHighlighted) {
    color = COLORS_RGB[source.type === 'mission' ? 'mission' : 'exoplanet']
    alpha = 0.45
    width = 1.8
  } else if (isDimmed) {
    alpha = 0.03
  }

  // Compute bezier curve offset for visual separation
  const dx = target.x - source.x
  const dy = target.y - source.y
  const mx = (source.x + target.x) / 2
  const my = (source.y + target.y) / 2
  const dist = Math.sqrt(dx * dx + dy * dy)
  const curveScale = link.curveScale ?? 0.15
  const curveBias = link.curveBias ?? 1
  const offset = Math.min(dist * curveScale, 24) * curveBias
  const nx = -dy / (dist || 1)
  const ny = dx / (dist || 1)
  const cpx = mx + nx * offset
  const cpy = my + ny * offset

  // Glow layer for highlighted links
  if (isHighlighted) {
    ctx.strokeStyle = `rgba(${color}, ${alpha * 0.4})`
    ctx.lineWidth = (width * 3) / globalScale
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.quadraticCurveTo(cpx, cpy, target.x, target.y)
    ctx.stroke()
  }

  // Core line
  ctx.strokeStyle = `rgba(${color}, ${alpha})`
  ctx.lineWidth = width / globalScale
  ctx.beginPath()
  ctx.moveTo(source.x, source.y)
  ctx.quadraticCurveTo(cpx, cpy, target.x, target.y)
  ctx.stroke()
}
