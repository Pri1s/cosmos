export const GUIDED_MISSION_ORDER = [
  'harps',
  'corot',
  'kepler',
  'tess',
  'hubble',
  'spitzer',
  'jwst',
]

const DEFAULT_STATUS = 'idle'
const VALID_STATUSES = new Set(['idle', 'active', 'paused', 'complete'])

function getNodeId(nodeLike) {
  return typeof nodeLike === 'object' ? nodeLike.id : nodeLike
}

function toNumber(value) {
  return typeof value === 'number' ? value : Number.parseFloat(value)
}

function uniqueIds(values) {
  return [...new Set(values)]
}

function isTemperate(node) {
  return typeof node.temperature === 'number' && node.temperature >= 240 && node.temperature <= 320
}

function isEarthSized(node) {
  return typeof node.radius === 'number' && node.radius >= 0.8 && node.radius <= 1.4
}

function isSuperEarth(node) {
  return typeof node.radius === 'number' && node.radius > 1.4 && node.radius <= 2.4
}

function isNearby(node) {
  return typeof node.distance === 'number' && node.distance <= 150
}

function isHistoric(node) {
  return typeof node.discoveryYear === 'number' && node.discoveryYear <= 2010
}

function isExtreme(node) {
  return (
    (typeof node.temperature === 'number' && node.temperature >= 1000) ||
    (toNumber(node.orbitalPeriod) > 0 && toNumber(node.orbitalPeriod) <= 2) ||
    (typeof node.mass === 'number' && node.mass >= 100) ||
    (typeof node.radius === 'number' && node.radius >= 8)
  )
}

function hasHabitabilitySignal(node) {
  return /habit|temperate|earth-like|earth size|liquid water|water/i.test(node.habitability ?? '')
}

export function scoreJourneyNode(node) {
  if (!node || node.type !== 'exoplanet') return 0

  let score = 0

  if (isTemperate(node)) score += 36
  else if (typeof node.temperature === 'number' && node.temperature >= 210 && node.temperature <= 360) score += 22

  if (hasHabitabilitySignal(node)) score += 26
  if (isEarthSized(node)) score += 24
  else if (isSuperEarth(node)) score += 18

  if (isNearby(node)) score += 16
  else if (typeof node.distance === 'number' && node.distance <= 400) score += 8

  if (isHistoric(node)) score += 14
  else if (typeof node.discoveryYear === 'number' && node.discoveryYear <= 2016) score += 7

  if (isExtreme(node)) score += 12

  return score
}

export function compareJourneyNodes(left, right) {
  const scoreDiff = scoreJourneyNode(right) - scoreJourneyNode(left)
  if (scoreDiff !== 0) return scoreDiff

  const yearDiff = (left.discoveryYear ?? Number.MAX_SAFE_INTEGER) - (right.discoveryYear ?? Number.MAX_SAFE_INTEGER)
  if (yearDiff !== 0) return yearDiff

  return left.name.localeCompare(right.name)
}

export function getJourneyTrait(node) {
  if (!node) return 'it adds another useful data point to the atlas'
  if (hasHabitabilitySignal(node) || isTemperate(node)) return 'it keeps the habitability question in play'
  if (isEarthSized(node)) return 'it sits close to Earth-size'
  if (isSuperEarth(node)) return 'it lands in the super-Earth range'
  if (isNearby(node)) return `it is relatively nearby at ${node.distance} light-years`
  if (isHistoric(node)) return `it is one of the earlier worlds in this catalog, discovered in ${node.discoveryYear}`
  if (isExtreme(node)) return 'it shows one of the catalog’s more extreme planetary profiles'
  if (node.method) return `it was found through ${node.method.toLowerCase()}`
  return 'it sharpens the shape of this mission cluster'
}

function buildNodeMap(nodes) {
  return Object.fromEntries(nodes.map((node) => [node.id, node]))
}

export function buildGuidedJourneyModel(nodes, links) {
  const nodeMap = buildNodeMap(nodes)
  const clustersByMissionId = Object.fromEntries(
    GUIDED_MISSION_ORDER
      .filter((missionId) => nodeMap[missionId]?.type === 'mission')
      .map((missionId) => [missionId, []])
  )
  const nodeMissionIdMap = {}
  const linkMembership = new Set()

  GUIDED_MISSION_ORDER.forEach((missionId) => {
    if (nodeMap[missionId]?.type === 'mission') {
      nodeMissionIdMap[missionId] = missionId
    }
  })

  links.forEach((link) => {
    const sourceId = getNodeId(link.source)
    const targetId = getNodeId(link.target)
    const sourceNode = nodeMap[sourceId]
    const targetNode = nodeMap[targetId]

    const missionNode = sourceNode?.type === 'mission'
      ? sourceNode
      : targetNode?.type === 'mission'
        ? targetNode
        : null
    const exoplanetNode = sourceNode?.type === 'exoplanet'
      ? sourceNode
      : targetNode?.type === 'exoplanet'
        ? targetNode
        : null

    if (!missionNode || !exoplanetNode || !clustersByMissionId[missionNode.id]) return

    const membershipKey = `${missionNode.id}:${exoplanetNode.id}`
    if (linkMembership.has(membershipKey)) return
    linkMembership.add(membershipKey)

    clustersByMissionId[missionNode.id].push(exoplanetNode.id)
    nodeMissionIdMap[exoplanetNode.id] = missionNode.id
  })

  const missionIds = GUIDED_MISSION_ORDER.filter((missionId) => nodeMap[missionId]?.type === 'mission')
  const clusters = missionIds.map((missionId) => {
    const missionNode = nodeMap[missionId]
    const exoplanetIds = uniqueIds(clustersByMissionId[missionId]).sort((leftId, rightId) => (
      compareJourneyNodes(nodeMap[leftId], nodeMap[rightId])
    ))

    return {
      missionId,
      missionNode,
      exoplanetIds,
      nodeIds: [missionId, ...exoplanetIds],
    }
  })

  const allNodeIds = clusters.flatMap((cluster) => cluster.nodeIds)

  return {
    missionIds,
    clusters,
    nodeMap,
    nodeMissionIdMap,
    totalCount: allNodeIds.length,
    allNodeIds,
  }
}

export function getInitialJourneyState(model) {
  const firstMissionId = model.missionIds[0] ?? null

  return {
    status: DEFAULT_STATUS,
    currentNodeId: firstMissionId,
    activeMissionId: firstMissionId,
    visitedNodeIds: [],
  }
}

export function hydrateJourneyState(model, storedState) {
  const fallback = getInitialJourneyState(model)
  if (!storedState || typeof storedState !== 'object') return fallback

  const visitedNodeIds = uniqueIds(
    Array.isArray(storedState.visitedNodeIds)
      ? storedState.visitedNodeIds.filter((nodeId) => model.nodeMap[nodeId])
      : []
  )
  const currentNodeId = model.nodeMap[storedState.currentNodeId]
    ? storedState.currentNodeId
    : fallback.currentNodeId
  const derivedMissionId = currentNodeId ? model.nodeMissionIdMap[currentNodeId] ?? currentNodeId : fallback.activeMissionId
  const activeMissionId = model.missionIds.includes(storedState.activeMissionId)
    ? storedState.activeMissionId
    : derivedMissionId
  const status = VALID_STATUSES.has(storedState.status) ? storedState.status : fallback.status

  if (visitedNodeIds.length >= model.totalCount && model.totalCount > 0) {
    return {
      status: 'complete',
      currentNodeId,
      activeMissionId,
      visitedNodeIds,
    }
  }

  return {
    status,
    currentNodeId,
    activeMissionId,
    visitedNodeIds,
  }
}

function getCluster(model, missionId) {
  return model.clusters.find((cluster) => cluster.missionId === missionId) ?? null
}

function getRemainingClusterExoplanetIds(model, missionId, visitedNodeIds, currentNodeId) {
  const cluster = getCluster(model, missionId)
  if (!cluster) return []

  const visitedSet = new Set(visitedNodeIds)
  return cluster.exoplanetIds.filter((nodeId) => !visitedSet.has(nodeId) && nodeId !== currentNodeId)
}

function buildUpcomingNodes(model, startMissionIndex, visitedNodeIds) {
  const visitedSet = new Set(visitedNodeIds)
  const queue = []

  for (let index = startMissionIndex; index < model.missionIds.length; index += 1) {
    const missionId = model.missionIds[index]
    const cluster = getCluster(model, missionId)
    if (!cluster) continue

    if (!visitedSet.has(missionId)) {
      queue.push({ nodeId: missionId, kind: 'mission-bridge' })
    }

    cluster.exoplanetIds.forEach((nodeId) => {
      if (!visitedSet.has(nodeId)) {
        queue.push({ nodeId, kind: index === startMissionIndex ? 'same-cluster' : 'next-cluster' })
      }
    })
  }

  return queue
}

export function buildRecommendationReason(node, clusterMissionNode, kind = 'same-cluster') {
  if (!node) return 'Continue the guided journey.'
  if (kind === 'mission-bridge') {
    return `${node.name} is the next mission hub in the journey order and opens the next cluster.`
  }

  const trait = getJourneyTrait(node)
  if (kind === 'next-cluster') {
    return `${node.name} is queued in the upcoming ${clusterMissionNode?.name ?? 'next'} cluster because ${trait}.`
  }

  return `${node.name} fits this cluster well because ${trait}.`
}

export function getJourneyRecommendations(model, journey, limit = 3) {
  if (!journey?.currentNodeId || journey.status === 'complete') return []

  const activeMissionId = journey.activeMissionId ?? model.nodeMissionIdMap[journey.currentNodeId]
  const activeMissionIndex = Math.max(0, model.missionIds.indexOf(activeMissionId))
  const activeCluster = getCluster(model, activeMissionId)
  const sameClusterIds = getRemainingClusterExoplanetIds(
    model,
    activeMissionId,
    journey.visitedNodeIds,
    journey.currentNodeId
  )
  const recommendations = sameClusterIds.map((nodeId) => ({
    nodeId,
    reason: buildRecommendationReason(model.nodeMap[nodeId], activeCluster?.missionNode, 'same-cluster'),
    kind: 'same-cluster',
  }))

  if (recommendations.length < limit) {
    const upcoming = buildUpcomingNodes(model, activeMissionIndex + 1, journey.visitedNodeIds)
      .filter((entry) => entry.nodeId !== journey.currentNodeId && !recommendations.some((item) => item.nodeId === entry.nodeId))

    upcoming.forEach((entry) => {
      if (recommendations.length >= limit) return

      const missionId = model.nodeMissionIdMap[entry.nodeId] ?? entry.nodeId
      const missionCluster = getCluster(model, missionId)
      recommendations.push({
        nodeId: entry.nodeId,
        reason: buildRecommendationReason(model.nodeMap[entry.nodeId], missionCluster?.missionNode, entry.kind),
        kind: entry.kind,
      })
    })
  }

  return recommendations.slice(0, limit)
}

function getNextNodeId(model, visitedNodeIds, preferredNodeId = null) {
  const visitedSet = new Set(visitedNodeIds)

  if (preferredNodeId && model.nodeMap[preferredNodeId] && !visitedSet.has(preferredNodeId)) {
    return preferredNodeId
  }

  return model.allNodeIds.find((nodeId) => !visitedSet.has(nodeId)) ?? null
}

function nextActiveMissionId(model, nodeId, fallbackMissionId = null) {
  if (!nodeId) return fallbackMissionId
  return model.nodeMissionIdMap[nodeId] ?? nodeId ?? fallbackMissionId
}

export function startJourney(model, journey) {
  const hydrated = hydrateJourneyState(model, journey)
  if (hydrated.status === 'complete') return hydrated

  return {
    ...hydrated,
    status: 'active',
    currentNodeId: hydrated.currentNodeId ?? model.missionIds[0] ?? null,
    activeMissionId: hydrated.activeMissionId ?? model.missionIds[0] ?? null,
  }
}

export function pauseJourney(model, journey) {
  const hydrated = hydrateJourneyState(model, journey)
  if (hydrated.status !== 'active') return hydrated
  return {
    ...hydrated,
    status: 'paused',
  }
}

export function resumeJourney(model, journey) {
  const hydrated = hydrateJourneyState(model, journey)
  if (hydrated.status === 'complete') return hydrated
  return {
    ...hydrated,
    status: 'active',
  }
}

export function restartJourney(model) {
  const next = getInitialJourneyState(model)
  return {
    ...next,
    status: 'active',
  }
}

export function markJourneyNodeVisited(model, journey) {
  const hydrated = hydrateJourneyState(model, journey)
  if (!hydrated.currentNodeId || hydrated.status === 'complete') return hydrated

  const visitedNodeIds = uniqueIds([...hydrated.visitedNodeIds, hydrated.currentNodeId])
  const nextStatus = visitedNodeIds.length >= model.totalCount ? 'complete' : hydrated.status

  return {
    ...hydrated,
    status: nextStatus,
    visitedNodeIds,
  }
}

export function continueJourney(model, journey, nextNodeId = null) {
  const visitedState = markJourneyNodeVisited(model, journey)
  if (visitedState.status === 'complete') return visitedState

  const validRecommendationIds = getJourneyRecommendations(model, visitedState).map((entry) => entry.nodeId)
  const resolvedNodeId = getNextNodeId(
    model,
    visitedState.visitedNodeIds,
    validRecommendationIds.includes(nextNodeId) ? nextNodeId : validRecommendationIds[0] ?? nextNodeId
  )

  return {
    ...visitedState,
    status: 'active',
    currentNodeId: resolvedNodeId,
    activeMissionId: nextActiveMissionId(model, resolvedNodeId, visitedState.activeMissionId),
  }
}

export function canSetJourneyCurrentFromNode(model, journey, nodeId) {
  const hydrated = hydrateJourneyState(model, journey)
  if (!model.nodeMap[nodeId] || hydrated.status === 'complete') return false
  if (hydrated.currentNodeId === nodeId) return false
  if (hydrated.visitedNodeIds.includes(nodeId)) return false
  return nextActiveMissionId(model, nodeId, null) === hydrated.activeMissionId
}

export function setJourneyCurrentFromNode(model, journey, nodeId) {
  if (!canSetJourneyCurrentFromNode(model, journey, nodeId)) {
    return hydrateJourneyState(model, journey)
  }

  const hydrated = hydrateJourneyState(model, journey)
  return {
    ...hydrated,
    status: hydrated.status === 'idle' ? 'active' : hydrated.status,
    currentNodeId: nodeId,
    activeMissionId: nextActiveMissionId(model, nodeId, hydrated.activeMissionId),
  }
}

export function buildJourneySummary(model, journey, nodeId) {
  const node = model.nodeMap[nodeId]
  if (!node) return ''

  const missionId = nextActiveMissionId(model, nodeId, null)
  const cluster = getCluster(model, missionId)
  const visitedSet = new Set(journey.visitedNodeIds)
  const remainingInCluster = cluster
    ? cluster.exoplanetIds.filter((candidateId) => !visitedSet.has(candidateId) && candidateId !== nodeId).length
    : 0

  if (node.type === 'mission') {
    return `${node.name} anchors this leg of the journey with ${cluster?.exoplanetIds.length ?? 0} linked worlds in the map and ${node.discoveryCount?.toLocaleString() ?? 'unknown'} confirmed discoveries. Start here, then branch into the strongest unvisited worlds in its cluster.`
  }

  const trait = getJourneyTrait(node)
  const method = node.method ? `${node.method.toLowerCase()} in ${node.discoveryYear ?? 'an unknown year'}` : `the ${cluster?.missionNode?.name ?? 'active'} cluster`
  return `${node.name} belongs to the ${cluster?.missionNode?.name ?? 'current'} cluster and was added through ${method}. It stands out because ${trait}. ${remainingInCluster} unvisited ${remainingInCluster === 1 ? 'world remains' : 'worlds remain'} in this cluster after this stop.`
}

export function buildCompletionSummary(model, journey) {
  const visitedCount = journey.visitedNodeIds.length
  if (visitedCount < model.totalCount) return ''

  return `You have completed the guided journey through all ${model.totalCount.toLocaleString()} nodes in Cosmos. Restart to take the path again from HARPS or keep exploring freely.`
}
