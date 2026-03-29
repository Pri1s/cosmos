import process from 'node:process'
import { writeFile } from 'node:fs/promises'
import {
  MAX_EXOPLANET_NODES,
  missionDiscoverySources,
  missionNodes,
} from './node-catalog.js'
import {
  allocatePlanetBudget,
  buildMissionCountQuery,
  buildMissionPlanetQuery,
  createTapUrl,
  mapArchivePlanetToNode,
  selectPlanetsByQuota,
  serializeGeneratedModule,
} from './nasa-sync.js'

const OUTPUT_URL = new URL('./generated-nasa-data.js', import.meta.url)
const missionLabelById = Object.fromEntries(
  missionDiscoverySources.map(source => [source.id, source.label]),
)

async function fetchArchiveJson(query, label) {
  const url = createTapUrl(query)
  console.log(`Fetching ${label} from NASA Exoplanet Archive`)

  const response = await fetch(url)
  if (!response.ok) {
    const body = await response.text()
    console.error(`NASA archive request failed for ${label}: ${response.status} ${response.statusText}`)
    console.error(body.slice(0, 400))
    throw new Error(`NASA archive request failed for ${label}`)
  }

  return response.json()
}

async function fetchMissionDiscoveryCounts() {
  const countsById = {}

  for (const source of missionDiscoverySources) {
    const rows = await fetchArchiveJson(buildMissionCountQuery(source), `${source.label} discovery count`)
    countsById[source.id] = rows[0]?.confirmed_count ?? 0
  }

  return countsById
}

async function fetchMissionPlanetRecords() {
  const recordsByMissionId = {}

  for (const source of missionDiscoverySources) {
    recordsByMissionId[source.id] = await fetchArchiveJson(
      buildMissionPlanetQuery(source),
      `${source.label} planets`,
    )
  }

  return recordsByMissionId
}

function buildGeneratedDataset(selectedPlanets) {
  const exoplanetNodes = selectedPlanets
    .map(({ id, missionIds, record }) => mapArchivePlanetToNode(record, missionLabelById[missionIds[0]], id))
    .sort((a, b) => {
      const yearDiff = (b.discoveryYear ?? 0) - (a.discoveryYear ?? 0)
      if (yearDiff !== 0) return yearDiff
      return a.name.localeCompare(b.name)
    })

  const links = selectedPlanets
    .flatMap(({ id, missionIds }) => missionIds.map(missionId => ({ source: missionId, target: id })))

  return { exoplanetNodes, links }
}

async function main() {
  const missionDiscoveryCountsById = await fetchMissionDiscoveryCounts()
  const recordsByMissionId = await fetchMissionPlanetRecords()
  const quotasByMissionId = allocatePlanetBudget(missionDiscoveryCountsById, MAX_EXOPLANET_NODES)
  const selectedPlanets = selectPlanetsByQuota(recordsByMissionId, quotasByMissionId)

  if (selectedPlanets.length === 0) {
    throw new Error('NASA sync produced no exoplanet nodes.')
  }

  if (selectedPlanets.length > MAX_EXOPLANET_NODES) {
    throw new Error(`NASA sync exceeded exoplanet cap: ${selectedPlanets.length} > ${MAX_EXOPLANET_NODES}`)
  }

  const { exoplanetNodes, links } = buildGeneratedDataset(selectedPlanets)
  const totalNodes = exoplanetNodes.length + missionNodes.length

  if (totalNodes > missionNodes.length + MAX_EXOPLANET_NODES) {
    throw new Error(`NASA sync exceeded total node cap: ${totalNodes}`)
  }

  const moduleSource = serializeGeneratedModule({
    syncedAt: new Date().toISOString(),
    exoplanetNodes,
    links,
    missionDiscoveryCountsById,
  })

  await writeFile(OUTPUT_URL, moduleSource, 'utf8')

  console.log(`Selected ${exoplanetNodes.length} exoplanets across ${missionNodes.length} mission hubs`)
  console.log(`Wrote NASA-backed node data to ${OUTPUT_URL.pathname}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
