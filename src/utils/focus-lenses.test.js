import { describe, expect, test } from 'vitest'
import { getFocusLenses } from './focus-lenses'
import { nodes, getNeighborIds } from '../data/graph-data.js'

function getNode(nodeId) {
  return nodes.find(node => node.id === nodeId)
}

function getNeighbors(nodeId) {
  const neighborIds = getNeighborIds(nodeId)
  return nodes.filter(node => neighborIds.has(node.id))
}

function getRepresentativeExoplanet() {
  return nodes.find(node =>
    node.type === 'exoplanet' &&
    getNeighborIds(node.id).size > 0 &&
    node.temperature != null &&
    node.radius != null
  ) ?? nodes.find(node => node.type === 'exoplanet')
}

describe('getFocusLenses', () => {
  test('returns the exoplanet lens set for a well-populated node', () => {
    const node = getRepresentativeExoplanet()
    const lenses = getFocusLenses(node, getNeighbors(node.id))

    expect(lenses).toHaveLength(6)
    expect(lenses.map(lens => lens.title)).toEqual([
      'Discovery',
      'Earth Comparison',
      'Habitability',
      'Extremes',
      'Related Missions',
      'Open Questions',
    ])
  })

  test('returns mission-specific lenses for mission nodes', () => {
    const node = getNode('jwst')
    const lenses = getFocusLenses(node, getNeighbors(node.id))

    expect(lenses.map(lens => lens.title)).toEqual([
      'Mission Role',
      'Detection Method',
      'Signature Discoveries',
      'Legacy',
      'Why It Matters',
      'Open Questions',
    ])
    expect(lenses.every(lens => lens.prompt.includes(node.name))).toBe(true)
  })

  test('missing fields still produce coherent non-empty lenses', () => {
    const node = {
      id: 'test-world',
      type: 'exoplanet',
      name: 'Test World',
      hostStar: 'Test Star',
      method: 'Transit',
      discoveryYear: 2031,
      mass: null,
      radius: null,
      temperature: null,
      habitability: '',
    }

    const lenses = getFocusLenses(node, [])

    expect(lenses.length).toBeGreaterThanOrEqual(4)
    expect(lenses.every(lens => lens.summary.trim().length > 0)).toBe(true)
    expect(lenses.every(lens => lens.prompt.includes('Test World'))).toBe(true)
  })

  test('each lens has structured content sections', () => {
    const node = getRepresentativeExoplanet()
    const lenses = getFocusLenses(node, getNeighbors(node.id))

    for (const lens of lenses) {
      expect(lens.whyItMatters).toBeDefined()
      expect(lens.whyItMatters.length).toBeGreaterThan(0)
      expect(Array.isArray(lens.facts)).toBe(true)
      expect(lens.facts.length).toBeGreaterThan(0)
      expect(lens.facts.every(f => f.label && f.value !== undefined)).toBe(true)
      expect(Array.isArray(lens.questions)).toBe(true)
      expect(lens.questions.length).toBeGreaterThan(0)
    }
  })

  test('mission lenses have structured content sections', () => {
    const node = getNode('kepler')
    const lenses = getFocusLenses(node, getNeighbors(node.id))

    for (const lens of lenses) {
      expect(lens.whyItMatters).toBeDefined()
      expect(Array.isArray(lens.facts)).toBe(true)
      expect(Array.isArray(lens.questions)).toBe(true)
    }

    const legacy = lenses.find(l => l.id === 'legacy')
    expect(legacy.facts.some(f => f.label === 'Discoveries')).toBe(true)
  })
})
