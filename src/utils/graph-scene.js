function getNodeId(nodeLike) {
  return typeof nodeLike === 'object' ? nodeLike.id : nodeLike
}

function hashString(value) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function pairKey(a, b) {
  return [a, b].sort().join('::')
}

function buildClusterMeshes(memberIds) {
  const pairs = new Set()

  for (let index = 0; index < memberIds.length - 1; index += 1) {
    pairs.add(pairKey(memberIds[index], memberIds[index + 1]))
  }

  if (memberIds.length >= 6) {
    for (let index = 0; index < memberIds.length - 3; index += 2) {
      pairs.add(pairKey(memberIds[index], memberIds[index + 3]))
    }
  }

  return [...pairs].map((key) => {
    const [sourceId, targetId] = key.split('::')
    return {
      sourceId,
      targetId,
      strength: 0.18 + ((hashString(key) % 5) * 0.03),
    }
  })
}

export function buildGraphSceneDetails(nodes, links) {
  const missionNodes = nodes.filter((node) => node.type === 'mission')
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const clusterMap = new Map(missionNodes.map((node) => [node.id, []]))

  for (const link of links) {
    const sourceId = getNodeId(link.source)
    const targetId = getNodeId(link.target)

    if (clusterMap.has(sourceId) && nodeMap.get(targetId)?.type === 'exoplanet') {
      clusterMap.get(sourceId).push(targetId)
    }
  }

  const clusters = missionNodes.map((missionNode) => {
    const memberIds = (clusterMap.get(missionNode.id) ?? [])
      .slice()
      .sort((leftId, rightId) => {
        const leftNode = nodeMap.get(leftId)
        const rightNode = nodeMap.get(rightId)
        const yearDiff = (leftNode?.discoveryYear ?? 0) - (rightNode?.discoveryYear ?? 0)
        if (yearDiff !== 0) return yearDiff
        return (leftNode?.name ?? leftId).localeCompare(rightNode?.name ?? rightId)
      })

    return {
      missionId: missionNode.id,
      memberIds,
      meshLinks: buildClusterMeshes(memberIds),
      ringCount: Math.max(1, Math.min(3, Math.ceil(memberIds.length / 16))),
      arcSeed: hashString(missionNode.id),
    }
  })

  const bridgePairKeys = new Set()
  const launchOrder = missionNodes
    .slice()
    .sort((left, right) => (left.launchYear ?? 0) - (right.launchYear ?? 0))
  const discoveryOrder = missionNodes
    .slice()
    .sort((left, right) => (right.discoveryCount ?? 0) - (left.discoveryCount ?? 0))

  for (let index = 0; index < launchOrder.length - 1; index += 1) {
    bridgePairKeys.add(pairKey(launchOrder[index].id, launchOrder[index + 1].id))
  }

  for (let index = 0; index < Math.min(discoveryOrder.length - 1, 4); index += 1) {
    bridgePairKeys.add(pairKey(discoveryOrder[index].id, discoveryOrder[index + 1].id))
  }

  const bridgeLinks = [...bridgePairKeys].map((key) => {
    const [sourceId, targetId] = key.split('::')
    return {
      sourceId,
      targetId,
      curveScale: 0.16 + ((hashString(key) % 4) * 0.02),
    }
  })

  return {
    clusters,
    meshLinks: clusters.flatMap((cluster) => cluster.meshLinks),
    bridgeLinks,
  }
}
