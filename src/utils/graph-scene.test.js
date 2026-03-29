import { describe, expect, it } from 'vitest'
import { buildGraphSceneDetails } from './graph-scene'
import { assignLinkOrbitMetrics } from './spiral-layout'

describe('graph scene details', () => {
  const nodes = [
    { id: 'mission-a', type: 'mission', name: 'Mission A', launchYear: 2000, discoveryCount: 12, x: 0, y: 0 },
    { id: 'mission-b', type: 'mission', name: 'Mission B', launchYear: 2010, discoveryCount: 8, x: 120, y: 40 },
    { id: 'planet-a', type: 'exoplanet', name: 'Planet A', discoveryYear: 2021, x: 10, y: 10 },
    { id: 'planet-b', type: 'exoplanet', name: 'Planet B', discoveryYear: 2022, x: 16, y: 18 },
    { id: 'planet-c', type: 'exoplanet', name: 'Planet C', discoveryYear: 2023, x: 28, y: 14 },
    { id: 'planet-d', type: 'exoplanet', name: 'Planet D', discoveryYear: 2024, x: 132, y: 54 },
  ]

  const links = [
    { source: 'mission-a', target: 'planet-a' },
    { source: 'mission-a', target: 'planet-b' },
    { source: 'mission-a', target: 'planet-c' },
    { source: 'mission-b', target: 'planet-d' },
  ]

  it('builds mission clusters, local meshes, and bridge links', () => {
    const sceneDetails = buildGraphSceneDetails(nodes, links)

    expect(sceneDetails.clusters).toHaveLength(2)
    expect(sceneDetails.bridgeLinks.length).toBeGreaterThan(0)

    const clusterA = sceneDetails.clusters.find((cluster) => cluster.missionId === 'mission-a')
    expect(clusterA.memberIds).toEqual(['planet-a', 'planet-b', 'planet-c'])
    expect(clusterA.meshLinks.length).toBeGreaterThan(0)
  })

  it('assigns varied orbit metrics to real graph links', () => {
    const mutableLinks = links.map((link) => ({ ...link }))

    assignLinkOrbitMetrics(nodes, mutableLinks)

    for (const link of mutableLinks) {
      expect(link.idealDistance).toBeGreaterThan(0)
      expect(Math.abs(link.curveBias)).toBe(1)
      expect(link.curveScale).toBeGreaterThanOrEqual(0.12)
    }
  })
})
