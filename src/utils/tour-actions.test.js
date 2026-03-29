import { describe, expect, it, vi } from 'vitest'
import { executeTourAction, executeTourActions, findTourNode } from './tour-actions'

function createGraphRef(nodes = []) {
  return {
    graphData() {
      return { nodes }
    },
    zoomToFit: vi.fn(),
    centerAt: vi.fn(),
    zoom: vi.fn(),
  }
}

describe('tour actions', () => {
  it('finds nodes from the live graph instance', () => {
    const node = { id: 'kepler-186f', x: 12, y: 24 }
    const graphRef = createGraphRef([node])

    expect(findTourNode(graphRef, 'kepler-186f')).toBe(node)
    expect(findTourNode(graphRef, 'missing')).toBeNull()
  })

  it('zooms the graph to fit for the map overview step', () => {
    const graphRef = createGraphRef()

    executeTourAction('zoomToFit', {
      graphRef,
      setSelectedNode: vi.fn(),
      enterFocusMode: vi.fn(),
      exitFocusMode: vi.fn(),
    })

    expect(graphRef.zoomToFit).toHaveBeenCalledWith(600, 60)
  })

  it('centers and zooms on a targeted node when coordinates exist', () => {
    const graphRef = createGraphRef([{ id: 'kepler', x: 100, y: 140 }])

    executeTourAction('centerOnNode:kepler', {
      graphRef,
      setSelectedNode: vi.fn(),
      enterFocusMode: vi.fn(),
      exitFocusMode: vi.fn(),
    })

    expect(graphRef.centerAt).toHaveBeenCalledWith(100, 140, 500)
    expect(graphRef.zoom).toHaveBeenCalledWith(2, 500)
  })

  it('selects a node for the detail card step', () => {
    const setSelectedNode = vi.fn()
    const node = { id: 'kepler', x: 100, y: 140 }

    executeTourAction('selectNode:kepler', {
      graphRef: createGraphRef([node]),
      setSelectedNode,
      enterFocusMode: vi.fn(),
      exitFocusMode: vi.fn(),
    })

    expect(setSelectedNode).toHaveBeenCalledWith(node)
  })

  it('enters focus mode with the resolved node', () => {
    const enterFocusMode = vi.fn()
    const node = { id: 'kepler', x: 100, y: 140 }

    executeTourAction('enterFocus:kepler', {
      graphRef: createGraphRef([node]),
      setSelectedNode: vi.fn(),
      enterFocusMode,
      exitFocusMode: vi.fn(),
    })

    expect(enterFocusMode).toHaveBeenCalledWith(node, { silent: true })
  })

  it('exits focus mode for the closing step', () => {
    const exitFocusMode = vi.fn()

    executeTourAction('exitFocus', {
      graphRef: createGraphRef(),
      setSelectedNode: vi.fn(),
      enterFocusMode: vi.fn(),
      exitFocusMode,
    })

    expect(exitFocusMode).toHaveBeenCalled()
  })

  it('ignores missing nodes without firing graph mutations', () => {
    const graphRef = createGraphRef()
    const setSelectedNode = vi.fn()
    const enterFocusMode = vi.fn()

    executeTourAction('selectNode:missing', {
      graphRef,
      setSelectedNode,
      enterFocusMode,
      exitFocusMode: vi.fn(),
    })
    executeTourAction('centerOnNode:missing', {
      graphRef,
      setSelectedNode,
      enterFocusMode,
      exitFocusMode: vi.fn(),
    })

    expect(setSelectedNode).not.toHaveBeenCalled()
    expect(enterFocusMode).not.toHaveBeenCalled()
    expect(graphRef.centerAt).not.toHaveBeenCalled()
    expect(graphRef.zoom).not.toHaveBeenCalled()
  })

  it('runs ordered action lists for story chapters', () => {
    const graphRef = createGraphRef([{ id: 'kepler', x: 100, y: 140 }])
    const setSelectedNode = vi.fn()

    executeTourActions(['centerOnNode:kepler', 'selectNode:kepler'], {
      graphRef,
      setSelectedNode,
      enterFocusMode: vi.fn(),
      exitFocusMode: vi.fn(),
    })

    expect(graphRef.centerAt).toHaveBeenCalledWith(100, 140, 500)
    expect(graphRef.zoom).toHaveBeenCalledWith(2, 500)
    expect(setSelectedNode).toHaveBeenCalledWith({ id: 'kepler', x: 100, y: 140 })
  })
})
