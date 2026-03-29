import { missionDiscoveryCountsById, nasaExoplanetNodes, nasaLinks } from './generated-nasa-data.js'
import { missionNodes } from './node-catalog.js'

function buildMissionNodes() {
  return missionNodes.map((node) => {
    const syncedDiscoveryCount = missionDiscoveryCountsById[node.id]

    if (syncedDiscoveryCount == null) {
      console.warn(`Missing NASA discovery count for mission node "${node.id}". Using curated fallback.`)
      return { ...node }
    }

    return {
      ...node,
      discoveryCount: syncedDiscoveryCount,
    }
  })
}

export const nodes = [
  ...buildMissionNodes(),
  ...nasaExoplanetNodes,
]

export const links = nasaLinks

const adjacencyMap = new Map()

function addAdjacency(a, b) {
  if (!adjacencyMap.has(a)) adjacencyMap.set(a, new Set())
  if (!adjacencyMap.has(b)) adjacencyMap.set(b, new Set())
  adjacencyMap.get(a).add(b)
  adjacencyMap.get(b).add(a)
}

links.forEach(link => addAdjacency(link.source, link.target))

export function getNeighborIds(nodeId) {
  return adjacencyMap.get(nodeId) || new Set()
}

export const graphData = { nodes, links }
