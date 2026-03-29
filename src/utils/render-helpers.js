const COLORS = {
  exoplanet: '#5ec4f7',
  mission: '#f76e5e',
}

const NODE_RADIUS = { exoplanet: 5, mission: 9 }

// Pre-generate star field once
let _stars = null
export function getStars(count = 300, spread = 2000) {
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

export function drawStars(ctx, globalScale) {
  const stars = getStars()
  const now = Date.now()
  for (const star of stars) {
    const twinkle = 0.7 + 0.3 * Math.sin(now / 3000 + star.twinkleOffset)
    const alpha = star.brightness * twinkle
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size / globalScale, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawNebulae(ctx) {
  // Galactic core glow at center
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 120)
  core.addColorStop(0, 'rgba(180, 160, 220, 0.06)')
  core.addColorStop(0.4, 'rgba(120, 100, 180, 0.03)')
  core.addColorStop(1, 'rgba(60, 40, 100, 0)')
  ctx.fillStyle = core
  ctx.fillRect(-120, -120, 240, 240)

  // Spiral arm nebulae — positioned along the arms
  const nebulae = [
    { x: -120, y: -80, r: 300, color: [80, 50, 160] },
    { x: 150, y: 120, r: 280, color: [40, 100, 140] },
    { x: -60, y: 180, r: 250, color: [100, 40, 100] },
    { x: 100, y: -150, r: 200, color: [60, 80, 140] },
  ]
  for (const n of nebulae) {
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
    grad.addColorStop(0, `rgba(${n.color.join(',')}, 0.03)`)
    grad.addColorStop(0.5, `rgba(${n.color.join(',')}, 0.015)`)
    grad.addColorStop(1, `rgba(${n.color.join(',')}, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2)
  }
}

export function drawNode(ctx, node, globalScale, { isSelected, isNeighbor, isDimmed, isHovered }) {
  if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return

  const color = COLORS[node.type]
  const baseR = NODE_RADIUS[node.type]
  const r = baseR / globalScale

  // Compute opacity
  let opacity = 1
  if (isDimmed) opacity = 0.12

  // Outer glow
  const glowR = r * (isHovered ? 4.5 : isSelected ? 4 : 3)
  const glowAlpha = (isHovered ? 0.25 : isSelected ? 0.22 : 0.12) * opacity
  const grad = ctx.createRadialGradient(node.x, node.y, r * 0.5, node.x, node.y, glowR)
  grad.addColorStop(0, withAlpha(color, glowAlpha))
  grad.addColorStop(1, withAlpha(color, 0))
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2)
  ctx.fill()

  // Pulsing ring for selected node
  if (isSelected) {
    const pulseAlpha = 0.4 + 0.15 * Math.sin(Date.now() / 400)
    ctx.strokeStyle = withAlpha(color, pulseAlpha * opacity)
    ctx.lineWidth = 1.5 / globalScale
    ctx.beginPath()
    ctx.arc(node.x, node.y, r * 2.2, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Main fill
  ctx.fillStyle = withAlpha(color, 0.9 * opacity)
  ctx.beginPath()
  ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
  ctx.fill()

  // Mission double-ring
  if (node.type === 'mission') {
    ctx.strokeStyle = withAlpha(color, 0.5 * opacity)
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
  const showLabel = isSelected || isHovered || isNeighbor || globalScale > 1.2
  if (showLabel) {
    const fontSize = Math.max(3, (isSelected || isHovered ? 11 : 9) / globalScale)
    const labelAlpha = (isSelected || isHovered ? 1 : isNeighbor ? 0.7 : 0.5) * opacity
    ctx.font = `${fontSize}px 'DM Mono', monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Text glow
    ctx.fillStyle = withAlpha(color, 0.3 * labelAlpha)
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
    const nodeColor = source.type === 'mission' ? COLORS.mission : COLORS.exoplanet
    color = hexToRgb(nodeColor)
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
  const offset = Math.min(dist * 0.15, 20)
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

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgbObj(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function hexToRgb(hex) {
  const { r, g, b } = hexToRgbObj(hex)
  return `${r}, ${g}, ${b}`
}

function hexToRgbObj(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}
