/**
 * Assigns initial positions to nodes along a Milky Way-style spiral pattern.
 * Two spiral arms, missions placed deliberately, exoplanets fan out along each arm.
 */

// Hand-tuned mission placements: [armIndex (0 or 1), t (0=core, 1=outer)]
const MISSION_PLACEMENTS = {
  jwst:    [0, 0.10],   // near galactic core
  tess:    [0, 0.35],   // inner arm 0
  kepler:  [0, 0.60],   // mid arm 0 — big hub
  corot:   [0, 0.88],   // outer arm 0

  hubble:  [1, 0.15],   // near core on arm 1
  spitzer: [1, 0.45],   // mid arm 1
  harps:   [1, 0.75],   // outer arm 1
}

const SPIRAL_TURNS = 0.75       // less than a full turn for a clear S-shape
const CORE_RADIUS = 18
const MAX_RADIUS = 140

function spiralPoint(arm, t) {
  const r = CORE_RADIUS + t * (MAX_RADIUS - CORE_RADIUS)
  const baseAngle = (arm / 2) * Math.PI * 2  // 2 arms, 180° apart
  const windAngle = baseAngle + t * SPIRAL_TURNS * Math.PI * 2
  return {
    x: r * Math.cos(windAngle),
    y: r * Math.sin(windAngle),
    angle: windAngle,
    dist: r,
  }
}

export function assignSpiralPositions(nodes, links) {
  // Build adjacency
  const missionIds = Object.keys(MISSION_PLACEMENTS)
  const missionExoplanets = new Map()
  missionIds.forEach(m => missionExoplanets.set(m, []))

  const exoplanetPrimaryMission = new Map()
  for (const link of links) {
    const src = typeof link.source === 'object' ? link.source.id : link.source
    const tgt = typeof link.target === 'object' ? link.target.id : link.target
    if (missionExoplanets.has(src)) {
      missionExoplanets.get(src).push(tgt)
    }
    if (!exoplanetPrimaryMission.has(tgt)) {
      exoplanetPrimaryMission.set(tgt, src)
    }
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const positioned = new Set()

  // Place missions on the spiral
  for (const [missionId, [arm, t]] of Object.entries(MISSION_PLACEMENTS)) {
    const node = nodeMap.get(missionId)
    if (!node) continue
    const pos = spiralPoint(arm, t)
    node.x = pos.x
    node.y = pos.y
    positioned.add(missionId)
  }

  // Place exoplanets near their primary mission, fanned along the spiral arm
  for (const node of nodes) {
    if (positioned.has(node.id)) continue

    const primaryMission = exoplanetPrimaryMission.get(node.id)
    const placement = primaryMission ? MISSION_PLACEMENTS[primaryMission] : null
    const missionNode = primaryMission ? nodeMap.get(primaryMission) : null

    if (placement && missionNode) {
      const [arm, t] = placement
      const siblings = missionExoplanets.get(primaryMission) || []
      const sibIndex = siblings.indexOf(node.id)
      const total = siblings.length

      // Fan exoplanets along the spiral arm near the mission
      // Offset t slightly for each sibling, spread perpendicular to arm
      const tOffset = ((sibIndex - (total - 1) / 2) / Math.max(total, 1)) * 0.12
      const perpOffset = ((sibIndex - (total - 1) / 2) / Math.max(total, 1)) * 25

      const pos = spiralPoint(arm, Math.max(0, Math.min(1, t + tOffset)))

      // Add perpendicular displacement
      const perpAngle = pos.angle + Math.PI / 2
      node.x = pos.x + Math.cos(perpAngle) * perpOffset
      node.y = pos.y + Math.sin(perpAngle) * perpOffset
    } else {
      // Unlinked — scatter in the disc
      const angle = Math.random() * Math.PI * 2
      const r = CORE_RADIUS + Math.random() * MAX_RADIUS * 0.6
      node.x = r * Math.cos(angle)
      node.y = r * Math.sin(angle)
    }
    positioned.add(node.id)
  }
}

/**
 * Custom d3 force that gently pulls nodes back toward their initial spiral positions.
 */
export function forceSpiralShape(nodes) {
  const targets = new Map()

  for (const node of nodes) {
    targets.set(node.id, { x: node.x, y: node.y })
  }

  function force(alpha) {
    const strength = 0.08 * alpha
    for (const node of nodes) {
      const target = targets.get(node.id)
      if (!target) continue
      node.vx += (target.x - node.x) * strength
      node.vy += (target.y - node.y) * strength
    }
  }

  force.initialize = function() {}
  return force
}
