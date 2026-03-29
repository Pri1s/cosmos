import { describe, expect, it, vi } from 'vitest'
import {
  VISITED_NODE_STORAGE_KEY,
  addVisitedNodeId,
  normalizeVisitedNodeIds,
  readVisitedNodeIds,
  writeVisitedNodeIds,
} from './visited-nodes'

describe('visited node helpers', () => {
  it('normalizes stored ids into unique non-empty strings', () => {
    expect(normalizeVisitedNodeIds([
      'kepler',
      '',
      'kepler',
      'tess',
      null,
      '  ',
    ])).toEqual(['kepler', 'tess'])
  })

  it('adds a visited node id without duplicating existing entries', () => {
    expect(addVisitedNodeId(['kepler'], 'tess')).toEqual(['kepler', 'tess'])
    expect(addVisitedNodeId(['kepler'], 'kepler')).toEqual(['kepler'])
  })

  it('reads and writes visited ids through session storage safely', () => {
    const setItem = vi.fn()
    const storage = {
      getItem: vi.fn(() => JSON.stringify(['kepler', 'tess', 'kepler'])),
      setItem,
    }
    const target = { sessionStorage: storage }

    expect(readVisitedNodeIds(target)).toEqual(['kepler', 'tess'])

    writeVisitedNodeIds(['tess', 'jwst', 'tess'], target)

    expect(setItem).toHaveBeenCalledWith(
      VISITED_NODE_STORAGE_KEY,
      JSON.stringify(['tess', 'jwst'])
    )
  })

  it('falls back to an empty list for invalid storage payloads', () => {
    const target = {
      sessionStorage: {
        getItem: vi.fn(() => '{bad json'),
      },
    }

    expect(readVisitedNodeIds(target)).toEqual([])
  })
})
