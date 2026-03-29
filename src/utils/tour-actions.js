export function findTourNode(graphRef, nodeId) {
  if (!graphRef || typeof graphRef.graphData !== 'function') return null
  return graphRef.graphData().nodes.find((node) => node.id === nodeId) ?? null
}

export function executeTourAction(actionStr, {
  graphRef,
  setSelectedNode,
  enterFocusMode,
  exitFocusMode,
}) {
  if (!actionStr) return

  if (actionStr === 'zoomToFit') {
    graphRef?.zoomToFit?.(600, 60)
    return
  }

  if (actionStr.startsWith('centerOnNode:')) {
    const nodeId = actionStr.split(':')[1]
    const node = findTourNode(graphRef, nodeId)
    if (node && node.x != null && node.y != null) {
      graphRef.centerAt(node.x, node.y, 500)
      graphRef.zoom(2, 500)
    }
    return
  }

  if (actionStr.startsWith('selectNode:')) {
    const nodeId = actionStr.split(':')[1]
    const node = findTourNode(graphRef, nodeId)
    if (node) setSelectedNode(node)
    return
  }

  if (actionStr.startsWith('enterFocus:')) {
    const nodeId = actionStr.split(':')[1]
    const node = findTourNode(graphRef, nodeId)
    if (node) enterFocusMode(node, { silent: true })
    return
  }

  if (actionStr === 'exitFocus') {
    exitFocusMode()
  }
}

export function executeTourActions(actions = [], context) {
  actions.forEach((action) => executeTourAction(action, context))
}
