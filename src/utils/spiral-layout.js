/**
 * Assigns initial positions to nodes along a Milky Way-style spiral pattern.
 * Missions stay on the core arms, while exoplanets are distributed in lanes
 * around their mission hub so the map remains readable at higher node counts.
 */

const MISSION_PLACEMENTS = {
  jwst: [0, 0.1],
  tess: [0, 0.35],
  kepler: [0, 0.6],
  corot: [0, 0.88],
  hubble: [1, 0.15],
  spitzer: [1, 0.45],
  harps: [1, 0.75],
}

const SPIRAL_TURNS = 0.9
const CORE_RADIUS = 22
const MAX_RADIUS = 220
const PLANETS_PER_LANE = 22
const LANE_GAP = 14
const ALONG_ARM_SPAN = 0.24
const MIN_LINK_DISTANCE = 16
const MAX_LINK_DISTANCE = 58

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function spiralPoint(arm, t) {
  const r = CORE_RADIUS + t * (MAX_RADIUS - CORE_RADIUS)
  const baseAngle = arm * Math.PI
  const windAngle = baseAngle + t * SPIRAL_TURNS * Math.PI * 2

  return {
    x: r * Math.cos(windAngle),
    y: r * Math.sin(windAngle),
    angle: windAngle,
  }
}

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function fallbackScatter(nodeId) {
  const hash = hashString(nodeId)
  const angle = (hash % 360) * (Math.PI / 180)
  const radius = CORE_RADIUS + (hash % 140)

  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  }
}

export function assignSpiralPositions(nodes, links) {
  const missionIds = Object.keys(MISSION_PLACEMENTS)
  const missionExoplanets = new Map()
  missionIds.forEach(id => missionExoplanets.set(id, []))

  const exoplanetPrimaryMission = new Map()

  for (const link of links) {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target

    if (missionExoplanets.has(sourceId)) {
      missionExoplanets.get(sourceId).push(targetId)
      if (!exoplanetPrimaryMission.has(targetId)) {
        exoplanetPrimaryMission.set(targetId, sourceId)
      }
    }
  }

  const nodeMap = new Map(nodes.map(node => [node.id, node]))

  for (const siblingIds of missionExoplanets.values()) {
    siblingIds.sort((leftId, rightId) => {
      const left = nodeMap.get(leftId)
      const right = nodeMap.get(rightId)
      const yearDiff = (left?.discoveryYear ?? 0) - (right?.discoveryYear ?? 0)
      if (yearDiff !== 0) return yearDiff
      return (left?.name ?? leftId).localeCompare(right?.name ?? rightId)
    })
  }

  const positioned = new Set()

  for (const [missionId, [arm, t]] of Object.entries(MISSION_PLACEMENTS)) {
    const node = nodeMap.get(missionId)
    if (!node) continue

    const pos = spiralPoint(arm, t)
    node.x = pos.x
    node.y = pos.y
    positioned.add(missionId)
  }

  for (const node of nodes) {
    if (positioned.has(node.id)) continue

    const primaryMission = exoplanetPrimaryMission.get(node.id)
    const placement = primaryMission ? MISSION_PLACEMENTS[primaryMission] : null

    if (!placement) {
      const pos = fallbackScatter(node.id)
      node.x = pos.x
      node.y = pos.y
      positioned.add(node.id)
      continue
    }

    const [arm, t] = placement
    const siblings = missionExoplanets.get(primaryMission) ?? []
    const siblingIndex = siblings.indexOf(node.id)
    const laneIndex = Math.floor(Math.max(siblingIndex, 0) / PLANETS_PER_LANE)
    const positionInLane = Math.max(siblingIndex, 0) % PLANETS_PER_LANE
    const laneStart = laneIndex * PLANETS_PER_LANE
    const laneSize = Math.min(PLANETS_PER_LANE, siblings.length - laneStart)
    const laneCount = Math.max(1, Math.ceil(siblings.length / PLANETS_PER_LANE))
    const centeredInLane = positionInLane - ((laneSize - 1) / 2)
    const alongStep = laneSize > 1 ? ALONG_ARM_SPAN / (laneSize - 1) : 0
    const tOffset = centeredInLane * alongStep
    const perpOffset = (laneIndex - ((laneCount - 1) / 2)) * LANE_GAP
    const pos = spiralPoint(arm, clamp(t + tOffset, 0.04, 0.96))
    const perpAngle = pos.angle + Math.PI / 2

    node.x = pos.x + Math.cos(perpAngle) * perpOffset
    node.y = pos.y + Math.sin(perpAngle) * perpOffset
    positioned.add(node.id)
  }
}

export function assignLinkOrbitMetrics(nodes, links) {
  const nodeMap = new Map(nodes.map(node => [node.id, node]))

  for (const link of links) {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source
    const targetId = typeof link.target === 'object' ? link.target.id : link.target
    const sourceNode = nodeMap.get(sourceId)
    const targetNode = nodeMap.get(targetId)

    if (!sourceNode || !targetNode) continue

    const dx = targetNode.x - sourceNode.x
    const dy = targetNode.y - sourceNode.y
    const distance = Math.hypot(dx, dy)
    const curveSeed = hashString(`${sourceId}:${targetId}`)

    link.idealDistance = clamp(distance * 0.76, MIN_LINK_DISTANCE, MAX_LINK_DISTANCE)
    link.curveBias = curveSeed % 2 === 0 ? 1 : -1
    link.curveScale = 0.12 + ((curveSeed % 5) * 0.02)
  }
}

export function forceSpiralShape(nodes, strengthScale = 1) {
  const targets = new Map()

  for (const node of nodes) {
    targets.set(node.id, { x: node.x, y: node.y })
  }

  function force(alpha) {
    const strength = 0.14 * strengthScale * alpha

    for (const node of nodes) {
      const target = targets.get(node.id)
      if (!target) continue

      node.vx += (target.x - node.x) * strength
      node.vy += (target.y - node.y) * strength
    }
  }

  force.initialize = function initialize() {}
  return force
}
