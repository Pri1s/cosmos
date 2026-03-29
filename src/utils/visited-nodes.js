export const VISITED_NODE_STORAGE_KEY = 'cosmos-visited-node-ids-v1'

function getStorage(target = globalThis) {
  return target?.sessionStorage ?? null
}

export function normalizeVisitedNodeIds(nodeIds) {
  if (!Array.isArray(nodeIds)) return []

  return [...new Set(
    nodeIds.filter((nodeId) => typeof nodeId === 'string' && nodeId.trim().length > 0)
  )]
}

export function readVisitedNodeIds(target = globalThis) {
  const storage = getStorage(target)
  if (!storage) return []

  try {
    const raw = storage.getItem(VISITED_NODE_STORAGE_KEY)
    return normalizeVisitedNodeIds(raw ? JSON.parse(raw) : [])
  } catch {
    return []
  }
}

export function writeVisitedNodeIds(nodeIds, target = globalThis) {
  const storage = getStorage(target)
  if (!storage) return

  try {
    storage.setItem(
      VISITED_NODE_STORAGE_KEY,
      JSON.stringify(normalizeVisitedNodeIds(nodeIds))
    )
  } catch {
    // sessionStorage may be unavailable
  }
}

export function addVisitedNodeId(nodeIds, nodeId) {
  if (typeof nodeId !== 'string' || nodeId.trim().length === 0) {
    return normalizeVisitedNodeIds(nodeIds)
  }

  return normalizeVisitedNodeIds([...(Array.isArray(nodeIds) ? nodeIds : []), nodeId])
}
