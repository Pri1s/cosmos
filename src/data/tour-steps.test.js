import { describe, expect, it } from 'vitest'
import { buildStorySteps } from './tour-steps'

const nodes = [
  {
    id: 'harps',
    type: 'mission',
    name: 'HARPS (Ground-based)',
    discoveryCount: 270,
  },
  {
    id: 'corot',
    type: 'mission',
    name: 'CoRoT',
    discoveryCount: 35,
  },
  {
    id: 'kepler',
    type: 'mission',
    name: 'Kepler',
    discoveryCount: 2783,
  },
  {
    id: 'tess',
    type: 'mission',
    name: 'TESS',
    discoveryCount: 765,
  },
  {
    id: 'jwst',
    type: 'mission',
    name: 'JWST',
    discoveryCount: 1,
  },
  { id: 'planet-a', type: 'exoplanet', name: 'Planet A' },
  { id: 'planet-b', type: 'exoplanet', name: 'Planet B' },
  { id: 'planet-c', type: 'exoplanet', name: 'Planet C' },
  { id: 'planet-d', type: 'exoplanet', name: 'Planet D' },
]

const links = [
  { source: 'harps', target: 'planet-a' },
  { source: 'harps', target: 'planet-b' },
  { source: 'corot', target: 'planet-b' },
  { source: 'kepler', target: 'planet-c' },
  { source: 'tess', target: 'planet-d' },
  { source: 'jwst', target: 'planet-d' },
]

describe('buildStorySteps', () => {
  it('builds the discovery story chapters in the intended order', () => {
    const steps = buildStorySteps({
      nodes,
      links,
      syncedAt: '2026-03-29T11:43:55.645Z',
    })

    expect(steps).toHaveLength(5)
    expect(steps.map((step) => step.id)).toEqual([
      'overview',
      'early-pipeline',
      'kepler-scale',
      'tess-handoff',
      'jwst-frontier',
    ])
    expect(steps[1].actions).toEqual(['centerOnNode:harps', 'selectNode:harps'])
    expect(steps[4].actions).toEqual(['enterFocus:jwst'])
  })

  it('interpolates live graph counts and sync metadata into the story copy', () => {
    const [overview, earlyPipeline, keplerScale, tessHandoff, jwstFrontier] = buildStorySteps({
      nodes,
      links,
      syncedAt: '2026-03-29T11:43:55.645Z',
    })

    expect(overview.narration).toContain('March 29, 2026')
    expect(overview.body).toContain('4 synced exoplanets')
    expect(overview.body).toContain('5 missions')

    expect(earlyPipeline.body).toContain('2 linked worlds')
    expect(earlyPipeline.body).toContain('270 confirmed discoveries')

    expect(keplerScale.body).toContain('2,783 confirmed discoveries')
    expect(tessHandoff.body).toContain('765 confirmed discoveries')
    expect(jwstFrontier.body).toContain('1 world here')
  })
})
