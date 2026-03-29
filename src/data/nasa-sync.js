export const NASA_EXOPLANET_ARCHIVE_TAP_URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync'

const EXOPLANET_COLUMNS = [
  'pl_name',
  'hostname',
  'disc_year',
  'discoverymethod',
  'disc_facility',
  'disc_telescope',
  'disc_instrument',
  'pl_bmasse',
  'pl_rade',
  'pl_orbper',
  'pl_eqt',
  'sy_dist',
]

const PARSECS_TO_LIGHT_YEARS = 3.26156
const MAX_ID_LENGTH = 64

function roundNumber(value, fractionDigits) {
  if (value == null || !Number.isFinite(value)) return null
  return Number(value.toFixed(fractionDigits))
}

function roundDistanceLightYears(parsecs) {
  if (parsecs == null || !Number.isFinite(parsecs)) return null

  const lightYears = parsecs * PARSECS_TO_LIGHT_YEARS
  if (lightYears >= 100) return Math.round(lightYears)
  if (lightYears >= 10) return roundNumber(lightYears, 1)
  return roundNumber(lightYears, 2)
}

function formatOrbitalPeriod(days) {
  if (days == null || !Number.isFinite(days)) return null
  return `${roundNumber(days, 2)} days`
}

function slugifyPlanetName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_ID_LENGTH)
}

function formatMethod(method) {
  return method ?? 'Unknown method'
}

function getTemperatureBand(temperature) {
  if (temperature == null) return 'unknown'
  if (temperature < 220) return 'cold'
  if (temperature <= 320) return 'temperate'
  if (temperature <= 700) return 'warm'
  return 'extreme-heat'
}

function getSizeClass(radius, mass) {
  if (radius != null) {
    if (radius < 0.8) return 'compact rocky world'
    if (radius <= 1.25) return 'Earth-size world'
    if (radius <= 2.2) return 'super-Earth'
    if (radius <= 4) return 'sub-Neptune'
    if (radius <= 10) return 'gas giant'
    return 'inflated giant planet'
  }

  if (mass != null) {
    if (mass < 0.5) return 'low-mass world'
    if (mass <= 2) return 'rocky-scale planet'
    if (mass <= 10) return 'super-Earth'
    if (mass <= 50) return 'Neptune-scale planet'
    return 'giant planet'
  }

  return 'exoplanet'
}

function withIndefiniteArticle(nounPhrase) {
  return /^[aeiou]/i.test(nounPhrase) ? `an ${nounPhrase}` : `a ${nounPhrase}`
}

export function createTapUrl(query) {
  const params = new URLSearchParams({
    query,
    format: 'json',
  })

  return `${NASA_EXOPLANET_ARCHIVE_TAP_URL}?${params.toString()}`
}

export function buildMissionPlanetQuery(source) {
  return `
    select ${EXOPLANET_COLUMNS.join(', ')}
    from pscomppars
    where ${source.filter}
  `.trim()
}

export function buildMissionCountQuery(source) {
  return `
    select count(*) as confirmed_count
    from pscomppars
    where ${source.filter}
  `.trim()
}

export function getRecordCompletenessScore(record) {
  let score = 0

  const weightedFields = [
    ['disc_year', 1],
    ['discoverymethod', 1],
    ['pl_bmasse', 3],
    ['pl_rade', 3],
    ['pl_orbper', 2],
    ['pl_eqt', 3],
    ['sy_dist', 2],
  ]

  for (const [field, weight] of weightedFields) {
    if (record[field] != null) score += weight
  }

  return score
}

function comparePlanetRecords(a, b) {
  const scoreDiff = getRecordCompletenessScore(b) - getRecordCompletenessScore(a)
  if (scoreDiff !== 0) return scoreDiff

  const yearDiff = (b.disc_year ?? 0) - (a.disc_year ?? 0)
  if (yearDiff !== 0) return yearDiff

  return a.pl_name.localeCompare(b.pl_name)
}

function buildPlanetNote(node, missionLabel) {
  const sizeClass = withIndefiniteArticle(getSizeClass(node.radius, node.mass))
  const method = formatMethod(node.method).toLowerCase()
  const base = `${node.name} is ${sizeClass} identified by ${missionLabel} using ${method}.`

  if (node.temperature != null) {
    const band = getTemperatureBand(node.temperature)
    if (band === 'temperate') {
      return `${base} Its equilibrium temperature is about ${node.temperature} K, placing it in the broad temperate range before atmosphere is considered.`
    }

    if (band === 'cold') {
      return `${base} Its equilibrium temperature is about ${node.temperature} K, which puts it on the cold side unless greenhouse warming changes the picture.`
    }

    if (band === 'warm') {
      return `${base} Its equilibrium temperature is about ${node.temperature} K, making it warmer than Earth-like surface conditions would suggest.`
    }

    return `${base} Its equilibrium temperature is about ${node.temperature} K, putting it firmly in an extreme heat regime.`
  }

  if (node.orbitalPeriod) {
    return `${base} It completes an orbit in ${node.orbitalPeriod}, but the archive does not provide a firm equilibrium temperature here.`
  }

  return `${base} NASA archive measurements for this world are still incomplete in the current capped dataset.`
}

export function mapArchivePlanetToNode(record, missionLabel, id) {
  const node = {
    id,
    type: 'exoplanet',
    name: record.pl_name,
    hostStar: record.hostname ?? null,
    discoveryYear: record.disc_year ?? null,
    method: record.discoverymethod ?? null,
    mass: roundNumber(record.pl_bmasse, 2),
    radius: roundNumber(record.pl_rade, 2),
    orbitalPeriod: formatOrbitalPeriod(record.pl_orbper),
    temperature: record.pl_eqt == null ? null : Math.round(record.pl_eqt),
    distance: roundDistanceLightYears(record.sy_dist),
  }

  return {
    ...node,
    habitability: buildPlanetNote(node, missionLabel),
  }
}

export function allocatePlanetBudget(countsById, maxExoplanetNodes) {
  const entries = Object.entries(countsById).filter(([, count]) => count > 0)
  const weights = entries.map(([id, count]) => ({
    id,
    count,
    weight: Math.sqrt(count),
  }))

  const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0)
  const quotas = Object.fromEntries(weights.map(({ id }) => [id, 0]))

  let allocated = 0

  for (const entry of weights) {
    const rawQuota = (entry.weight / totalWeight) * maxExoplanetNodes
    quotas[entry.id] = Math.min(entry.count, Math.floor(rawQuota))
    allocated += quotas[entry.id]
  }

  let remaining = maxExoplanetNodes - allocated

  while (remaining > 0) {
    const candidates = weights
      .filter(entry => quotas[entry.id] < entry.count)
      .map((entry) => ({
        ...entry,
        fractional: ((entry.weight / totalWeight) * maxExoplanetNodes) - quotas[entry.id],
      }))
      .sort((a, b) => {
        const fractionalDiff = b.fractional - a.fractional
        if (fractionalDiff !== 0) return fractionalDiff
        return b.count - a.count
      })

    if (candidates.length === 0) break

    quotas[candidates[0].id] += 1
    remaining -= 1
  }

  return quotas
}

export function selectPlanetsByQuota(recordsByMissionId, quotasByMissionId) {
  const selected = []
  const selectedByName = new Map()
  const usedIds = new Set()

  function createUniqueId(name) {
    const base = slugifyPlanetName(name)
    let id = base
    let suffix = 2

    while (usedIds.has(id)) {
      id = `${base}-${suffix}`
      suffix += 1
    }

    usedIds.add(id)
    return id
  }

  for (const [missionId, records] of Object.entries(recordsByMissionId)) {
    const quota = quotasByMissionId[missionId] ?? 0
    if (quota <= 0) continue

    const rankedRecords = [...records].sort(comparePlanetRecords)
    let addedForMission = 0

    for (const record of rankedRecords) {
      const existing = selectedByName.get(record.pl_name)

      if (existing) {
        if (!existing.missionIds.includes(missionId)) {
          existing.missionIds.push(missionId)
        }
        continue
      }

      const id = createUniqueId(record.pl_name)
      const entry = {
        id,
        missionIds: [missionId],
        record,
      }

      selected.push(entry)
      selectedByName.set(record.pl_name, entry)
      addedForMission += 1

      if (addedForMission >= quota) break
    }
  }

  return selected
}

export function serializeGeneratedModule({
  syncedAt,
  exoplanetNodes,
  links,
  missionDiscoveryCountsById,
}) {
  return `// Generated by npm run sync:nasa-data. Do not edit by hand.
export const NASA_SYNCED_AT = ${JSON.stringify(syncedAt)}

export const nasaExoplanetNodes = ${JSON.stringify(exoplanetNodes, null, 2)}

export const nasaLinks = ${JSON.stringify(links, null, 2)}

export const missionDiscoveryCountsById = ${JSON.stringify(missionDiscoveryCountsById, null, 2)}
`
}
