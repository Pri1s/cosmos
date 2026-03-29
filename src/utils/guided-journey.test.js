import { describe, expect, it } from 'vitest'
import {
  buildGuidedJourneyModel,
  canSetJourneyCurrentFromNode,
  continueJourney,
  getInitialJourneyState,
  getJourneyRecommendations,
  hydrateJourneyState,
  markJourneyNodeVisited,
  startJourney,
} from './guided-journey'

const nodes = [
  { id: 'harps', type: 'mission', name: 'HARPS (Ground-based)', discoveryCount: 270 },
  { id: 'corot', type: 'mission', name: 'CoRoT', discoveryCount: 35 },
  { id: 'kepler', type: 'mission', name: 'Kepler', discoveryCount: 2783 },
  {
    id: 'harps-habitable',
    type: 'exoplanet',
    name: 'HARPS Habitable',
    discoveryYear: 2012,
    method: 'Radial Velocity',
    radius: 1.05,
    temperature: 289,
    distance: 42,
    habitability: 'A temperate world that keeps the habitability question in play.',
  },
  {
    id: 'harps-historic',
    type: 'exoplanet',
    name: 'HARPS Historic',
    discoveryYear: 2007,
    method: 'Radial Velocity',
    radius: 2.9,
    temperature: 480,
    distance: 180,
  },
  {
    id: 'harps-extreme',
    type: 'exoplanet',
    name: 'HARPS Extreme',
    discoveryYear: 2018,
    method: 'Radial Velocity',
    radius: 9.1,
    temperature: 1400,
    distance: 610,
  },
  {
    id: 'corot-habitable',
    type: 'exoplanet',
    name: 'CoRoT Habitable',
    discoveryYear: 2015,
    method: 'Transit',
    radius: 1.2,
    temperature: 300,
    distance: 98,
    habitability: 'A broadly temperate world.',
  },
  {
    id: 'corot-extreme',
    type: 'exoplanet',
    name: 'CoRoT Extreme',
    discoveryYear: 2019,
    method: 'Transit',
    radius: 10.2,
    temperature: 1500,
    distance: 900,
  },
  {
    id: 'kepler-nearby',
    type: 'exoplanet',
    name: 'Kepler Nearby',
    discoveryYear: 2016,
    method: 'Transit',
    radius: 1.6,
    temperature: 315,
    distance: 120,
  },
]

const links = [
  { source: 'harps', target: 'harps-habitable' },
  { source: 'harps', target: 'harps-historic' },
  { source: 'harps', target: 'harps-extreme' },
  { source: 'corot', target: 'corot-habitable' },
  { source: 'corot', target: 'corot-extreme' },
  { source: 'kepler', target: 'kepler-nearby' },
]

describe('guided journey', () => {
  it('builds mission clusters in the fixed order and ranks exoplanets deterministically', () => {
    const model = buildGuidedJourneyModel(nodes, links)

    expect(model.missionIds).toEqual(['harps', 'corot', 'kepler'])
    expect(model.clusters[0].exoplanetIds).toEqual([
      'harps-habitable',
      'harps-historic',
      'harps-extreme',
    ])
  })

  it('starts at the first mission and then advances through its ranked cluster', () => {
    const model = buildGuidedJourneyModel(nodes, links)
    const started = startJourney(model, getInitialJourneyState(model))

    expect(started.status).toBe('active')
    expect(started.currentNodeId).toBe('harps')

    const recommendations = getJourneyRecommendations(model, started)
    expect(recommendations.map((entry) => entry.nodeId)).toEqual([
      'harps-habitable',
      'harps-historic',
      'harps-extreme',
    ])

    const afterMission = continueJourney(model, started)
    expect(afterMission.visitedNodeIds).toContain('harps')
    expect(afterMission.currentNodeId).toBe('harps-habitable')

    const afterHabitable = continueJourney(model, afterMission)
    expect(afterHabitable.visitedNodeIds).toContain('harps-habitable')
    expect(afterHabitable.currentNodeId).toBe('harps-historic')
  })

  it('bridges to the next mission when a cluster is exhausted', () => {
    const model = buildGuidedJourneyModel(nodes, links)
    let state = startJourney(model, getInitialJourneyState(model))

    state = continueJourney(model, state) // harps -> first exoplanet
    state = continueJourney(model, state) // first -> second
    state = continueJourney(model, state) // second -> third
    state = continueJourney(model, state) // third -> next mission

    expect(state.currentNodeId).toBe('corot')
    expect(state.activeMissionId).toBe('corot')
  })

  it('hydrates stored progress safely and strips stale node ids', () => {
    const model = buildGuidedJourneyModel(nodes, links)
    const hydrated = hydrateJourneyState(model, {
      status: 'paused',
      currentNodeId: 'missing-node',
      activeMissionId: 'corot',
      visitedNodeIds: ['harps', 'harps-habitable', 'missing-node'],
    })

    expect(hydrated.status).toBe('paused')
    expect(hydrated.currentNodeId).toBe('harps')
    expect(hydrated.activeMissionId).toBe('corot')
    expect(hydrated.visitedNodeIds).toEqual(['harps', 'harps-habitable'])
  })

  it('only allows manual adoption for unvisited nodes inside the active cluster', () => {
    const model = buildGuidedJourneyModel(nodes, links)
    const started = startJourney(model, getInitialJourneyState(model))
    const visited = markJourneyNodeVisited(model, started)

    expect(canSetJourneyCurrentFromNode(model, visited, 'harps-historic')).toBe(true)
    expect(canSetJourneyCurrentFromNode(model, visited, 'corot')).toBe(false)
    expect(canSetJourneyCurrentFromNode(model, visited, 'harps')).toBe(false)
  })
})
