import { describe, expect, test } from 'vitest'
import { missionDiscoveryCountsById, nasaExoplanetNodes, nasaLinks } from './generated-nasa-data.js'
import { nodes } from './graph-data.js'
import {
  MAX_EXOPLANET_NODES,
  MAX_GRAPH_NODES,
  missionDiscoverySources,
  missionNodes,
} from './node-catalog.js'
import {
  allocatePlanetBudget,
  buildMissionCountQuery,
  buildMissionPlanetQuery,
  mapArchivePlanetToNode,
  selectPlanetsByQuota,
  serializeGeneratedModule,
} from './nasa-sync.js'

describe('NASA sync helpers', () => {
  test('builds a mission planet query from a source filter', () => {
    const query = buildMissionPlanetQuery({
      filter: "disc_facility = 'Kepler'",
    })

    expect(query).toContain('from pscomppars')
    expect(query).toContain("disc_facility = 'Kepler'")
    expect(query).toContain('pl_name')
  })

  test('builds a mission count query from a source filter', () => {
    const query = buildMissionCountQuery({
      filter: "disc_facility = 'Kepler'",
    })

    expect(query).toContain('count(*) as confirmed_count')
    expect(query).toContain("disc_facility = 'Kepler'")
  })

  test('maps NASA archive fields into the app node shape', () => {
    const node = mapArchivePlanetToNode({
      pl_name: '51 Peg b',
      hostname: '51 Peg',
      disc_year: 1995,
      discoverymethod: 'Radial Velocity',
      pl_bmasse: 146.2018,
      pl_rade: 14.3,
      pl_orbper: 4.230785,
      pl_eqt: null,
      sy_dist: 15.4614,
    }, 'HARPS', '51-peg-b')

    expect(node).toEqual({
      id: '51-peg-b',
      type: 'exoplanet',
      name: '51 Peg b',
      hostStar: '51 Peg',
      discoveryYear: 1995,
      method: 'Radial Velocity',
      mass: 146.2,
      radius: 14.3,
      orbitalPeriod: '4.23 days',
      temperature: null,
      distance: 50.4,
      habitability: '51 Peg b is an inflated giant planet identified by HARPS using radial velocity. It completes an orbit in 4.23 days, but the archive does not provide a firm equilibrium temperature here.',
    })
  })

  test('allocates the exoplanet budget without exceeding the cap', () => {
    const quotas = allocatePlanetBudget({
      kepler: 2783,
      tess: 765,
      jwst: 1,
      hubble: 6,
      corot: 35,
      harps: 270,
      spitzer: 4,
    }, MAX_EXOPLANET_NODES)

    const total = Object.values(quotas).reduce((sum, value) => sum + value, 0)

    expect(total).toBe(MAX_EXOPLANET_NODES)
    expect(quotas.kepler).toBeGreaterThan(quotas.hubble)
    expect(quotas.tess).toBeGreaterThan(quotas.spitzer)
  })

  test('selection deduplicates planets across mission buckets', () => {
    const selected = selectPlanetsByQuota({
      kepler: [
        { pl_name: 'Planet A', disc_year: 2025, pl_rade: 1.1, pl_eqt: 280 },
        { pl_name: 'Planet B', disc_year: 2024, pl_rade: 2.1 },
      ],
      tess: [
        { pl_name: 'Planet A', disc_year: 2025, pl_rade: 1.1, pl_eqt: 280 },
        { pl_name: 'Planet C', disc_year: 2023, pl_rade: 1.4 },
      ],
    }, {
      kepler: 2,
      tess: 2,
    })

    expect(selected.map(entry => entry.record.pl_name)).toEqual(['Planet A', 'Planet B', 'Planet C'])
    expect(selected[0].missionIds).toEqual(['kepler', 'tess'])
  })

  test('serializes a generated data module with all exports', () => {
    const source = serializeGeneratedModule({
      syncedAt: '2026-03-29T00:00:00.000Z',
      exoplanetNodes: [{ id: 'demo', name: 'Demo', type: 'exoplanet' }],
      links: [{ source: 'kepler', target: 'demo' }],
      missionDiscoveryCountsById: { kepler: 2783 },
    })

    expect(source).toContain('export const NASA_SYNCED_AT')
    expect(source).toContain('export const nasaExoplanetNodes')
    expect(source).toContain('export const nasaLinks')
    expect(source).toContain('export const missionDiscoveryCountsById')
  })
})

describe('NASA-backed graph data', () => {
  test('stays within the requested graph size cap', () => {
    expect(nodes.length).toBeLessThanOrEqual(MAX_GRAPH_NODES)
    expect(nasaExoplanetNodes.length).toBeLessThanOrEqual(MAX_EXOPLANET_NODES)
    expect(nodes.filter(node => node.type === 'mission')).toHaveLength(missionNodes.length)
  })

  test('contains generated exoplanet nodes with data-derived notes', () => {
    expect(nasaExoplanetNodes.length).toBe(MAX_EXOPLANET_NODES)

    for (const node of nasaExoplanetNodes.slice(0, 20)) {
      expect(node.id).toBeTruthy()
      expect(node.name).toBeTruthy()
      expect(node.method).toBeTruthy()
      expect(node.habitability.length).toBeGreaterThan(30)
    }
  })

  test('contains links and mission discovery counts for the generated graph', () => {
    expect(Object.keys(missionDiscoveryCountsById)).toHaveLength(missionDiscoverySources.length)
    expect(nasaLinks.length).toBeGreaterThan(0)

    const targetIds = new Set(nasaExoplanetNodes.map(node => node.id))
    for (const link of nasaLinks.slice(0, 50)) {
      expect(targetIds.has(link.target)).toBe(true)
    }
  })
})
