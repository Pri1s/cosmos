const NUMBER_FORMATTER = new Intl.NumberFormat('en-US')
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

function getNodeId(nodeLike) {
  return typeof nodeLike === 'object' ? nodeLike.id : nodeLike
}

function formatCount(count, singular, plural = `${singular}s`) {
  return `${NUMBER_FORMATTER.format(count)} ${count === 1 ? singular : plural}`
}

function formatDiscoveryCount(count) {
  return formatCount(count, 'confirmed discovery', 'confirmed discoveries')
}

function formatSyncDate(syncedAt) {
  if (!syncedAt) return 'a recent NASA sync'

  const date = new Date(syncedAt)
  if (Number.isNaN(date.getTime())) return 'a recent NASA sync'
  return DATE_FORMATTER.format(date)
}

function findMission(nodes, missionId) {
  return nodes.find((node) => node.type === 'mission' && node.id === missionId) ?? null
}

function getMissionNeighborCount(links, missionId) {
  if (!missionId) return 0

  return links.reduce((count, link) => {
    const sourceId = getNodeId(link.source)
    const targetId = getNodeId(link.target)
    return sourceId === missionId || targetId === missionId ? count + 1 : count
  }, 0)
}

function getMissionActions(mission, includeFocus = false) {
  if (!mission?.id) return []

  if (includeFocus) {
    return [`enterFocus:${mission.id}`]
  }

  return [`centerOnNode:${mission.id}`, `selectNode:${mission.id}`]
}

export function buildStorySteps({ nodes, links, syncedAt }) {
  const missionNodes = nodes.filter((node) => node.type === 'mission')
  const exoplanetCount = nodes.filter((node) => node.type === 'exoplanet').length
  const syncedLabel = formatSyncDate(syncedAt)

  const harps = findMission(nodes, 'harps')
  const corot = findMission(nodes, 'corot')
  const kepler = findMission(nodes, 'kepler')
  const tess = findMission(nodes, 'tess')
  const jwst = findMission(nodes, 'jwst')

  const harpsNeighborCount = getMissionNeighborCount(links, harps?.id)
  const corotNeighborCount = getMissionNeighborCount(links, corot?.id)
  const keplerNeighborCount = getMissionNeighborCount(links, kepler?.id)
  const tessNeighborCount = getMissionNeighborCount(links, tess?.id)
  const jwstNeighborCount = getMissionNeighborCount(links, jwst?.id)

  return [
    {
      id: 'overview',
      title: 'The Atlas Comes Into View',
      body: `Cosmos currently connects ${formatCount(exoplanetCount, 'synced exoplanet')} to ${formatCount(missionNodes.length, 'mission')}. Start zoomed out, then drag to pan and scroll to zoom through the discovery network.`,
      narration: `Welcome to Cosmos. This story is built from NASA data synced on ${syncedLabel}, and right now the map links ${formatCount(exoplanetCount, 'exoplanet')} to ${formatCount(missionNodes.length, 'discovery mission')}. We begin zoomed all the way out because the point is not one world at a time. The point is how a handful of missions changed the scale of what humanity could see.`,
      target: '.map-area',
      tooltipPosition: 'right',
      actions: ['zoomToFit'],
      delayMs: 700,
    },
    {
      id: 'early-pipeline',
      title: 'Signals Become Evidence',
      body: `${harps?.name ?? 'HARPS'} anchors the early pipeline here with ${formatCount(harpsNeighborCount, 'linked world')} and ${formatDiscoveryCount(harps?.discoveryCount ?? 0)}. ${corot?.name ?? 'CoRoT'} helped prove that transit hunting from space could scale.`,
      narration: `Before exoplanets became a census, they were fragile signals that had to be defended. ${harps?.name ?? 'HARPS'} made stellar wobble repeatable enough to trust, and in this snapshot it links to ${formatCount(harpsNeighborCount, 'world')} while representing ${formatDiscoveryCount(harps?.discoveryCount ?? 0)}. ${corot?.name ?? 'CoRoT'} opened the space-based transit era with ${formatCount(corotNeighborCount, 'linked world')} in the map, proving that the search could move from clever detections to a methodical pipeline.`,
      target: '.detail-panel',
      tooltipPosition: 'left',
      actions: getMissionActions(harps),
      delayMs: 560,
    },
    {
      id: 'kepler-scale',
      title: 'Planets Become a Population',
      body: `${kepler?.name ?? 'Kepler'} is the turning point: ${formatDiscoveryCount(kepler?.discoveryCount ?? 0)} and ${formatCount(keplerNeighborCount, 'linked world')} in this live graph. Exoplanets stop looking rare and start looking inevitable.`,
      narration: `${kepler?.name ?? 'Kepler'} changed the question from "do planets exist?" to "how common are they?" In this synced map, it touches ${formatCount(keplerNeighborCount, 'world')} and stands for ${formatDiscoveryCount(kepler?.discoveryCount ?? 0)}. That is the moment the field stops collecting curiosities and starts reading an actual planetary population.`,
      target: '.detail-panel',
      tooltipPosition: 'left',
      actions: getMissionActions(kepler),
      delayMs: 560,
    },
    {
      id: 'tess-handoff',
      title: 'The Search Moves Closer',
      body: `${tess?.name ?? 'TESS'} picks up where Kepler leaves off, scanning brighter nearby stars. It contributes ${formatDiscoveryCount(tess?.discoveryCount ?? 0)} and ${formatCount(tessNeighborCount, 'linked world')} to this story-ready snapshot.`,
      narration: `${tess?.name ?? 'TESS'} inherits the search, but shifts the emphasis. Instead of staring at one patch of sky, it sweeps for nearby systems we can revisit with other instruments. In the current graph it links to ${formatCount(tessNeighborCount, 'world')} and represents ${formatDiscoveryCount(tess?.discoveryCount ?? 0)}, which makes it the bridge between discovery at scale and follow-up science.`,
      target: '.detail-panel',
      tooltipPosition: 'left',
      actions: getMissionActions(tess),
      delayMs: 560,
    },
    {
      id: 'jwst-frontier',
      title: 'From Worlds to Atmospheres',
      body: `${jwst?.name ?? 'JWST'} is the frontier chapter. It only links to ${formatCount(jwstNeighborCount, 'world')} here, but that is the point: the story shifts from finding planets to interpreting what their atmospheres might reveal. Finish this chapter, then explore on your own.`,
      narration: `${jwst?.name ?? 'JWST'} marks a different era. Kepler and TESS were about discovering worlds in bulk. JWST is about depth: chemistry, atmospheres, and whether a planet can be described as more than a dot in a catalog. Even with ${formatCount(jwstNeighborCount, 'linked world')} in this snapshot, it represents the question that comes after discovery. What are these worlds actually like?`,
      target: '.focus-render-panel',
      tooltipPosition: 'left',
      actions: getMissionActions(jwst, true),
      delayMs: 900,
    },
  ]
}
