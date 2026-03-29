function formatList(items) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function formatTemperature(value) {
  return value ? `${value} K` : 'an unknown equilibrium temperature'
}

function formatRadius(radius) {
  if (!radius) return 'an unknown radius'
  if (radius < 0.9) return `${radius} Earth radii, a bit smaller than Earth`
  if (radius <= 1.25) return `${radius} Earth radii, close to Earth-size`
  if (radius <= 2.2) return `${radius} Earth radii, in the super-Earth range`
  return `${radius} Earth radii, well above Earth-size`
}

function formatMass(mass) {
  if (!mass) return null
  if (mass < 0.5) return `${mass}× Earth — lighter than our planet`
  if (mass <= 2) return `${mass}× Earth — in the rocky-world range`
  if (mass <= 10) return `${mass}× Earth — super-Earth territory`
  return `${mass}× Earth — gas giant scale`
}

function getTemperatureTone(temperature) {
  if (!temperature) return 'We still need better temperature estimates before anyone can call its surface conditions with confidence.'
  if (temperature < 240) return 'It sits on the colder side of the temperate range, so any habitability story likely depends on atmosphere and internal heat.'
  if (temperature <= 320) return 'Its estimated temperature lands in the most intriguing middle ground for surface liquid water.'
  return 'Its heat budget pushes it away from easy Earth analogies, even before atmosphere enters the picture.'
}

function getTemperatureLabel(temperature) {
  if (!temperature) return 'Unknown'
  if (temperature < 200) return 'Frigid'
  if (temperature < 260) return 'Cold'
  if (temperature <= 320) return 'Temperate'
  if (temperature <= 500) return 'Warm'
  if (temperature <= 1000) return 'Hot'
  return 'Extreme'
}

function getExtremesCopy(node) {
  if (node.orbitalPeriod && parseFloat(node.orbitalPeriod) < 2) {
    return `${node.name} whips around ${node.hostStar} every ${node.orbitalPeriod}, which points to an extremely tight orbit and dramatic star-driven conditions.`
  }
  if (node.temperature && node.temperature > 1200) {
    return `At roughly ${node.temperature} K, ${node.name} lives in the extreme-heat category where atmospheres and surfaces can behave in exotic ways.`
  }
  if (node.hostStar?.includes('binary')) {
    return `${node.name} orbits a binary star system, making it one of the more unusual architectures in the map.`
  }
  return `${node.name} stands out because its basic measurements already push on what a familiar planet can look like.`
}

function getExtremeTrait(node) {
  if (node.orbitalPeriod && parseFloat(node.orbitalPeriod) < 2) return 'Ultra-short orbit'
  if (node.temperature && node.temperature > 1200) return 'Extreme heat'
  if (node.hostStar?.includes('binary')) return 'Binary star system'
  if (node.mass && node.mass > 100) return 'Gas giant mass'
  if (node.radius && node.radius > 2) return 'Super-Earth+'
  return 'Unusual profile'
}

function getOpenQuestionCopy(node) {
  if (!node.mass) {
    return `We still do not have a clean mass estimate for ${node.name}, which limits how precisely we can talk about its density and composition.`
  }
  if (!node.radius) {
    return `Radius remains uncertain for ${node.name}, so the biggest open question is what kind of world this actually is in bulk.`
  }
  if (!node.temperature) {
    return `The next big question is environmental: we still lack enough information to describe ${node.name}'s temperature and atmosphere with confidence.`
  }
  return `The real open question for ${node.name} is what its atmosphere is doing, because that determines whether the raw measurements tell the whole story.`
}

function getEarthComparison(node) {
  const comparisons = []
  if (node.radius) {
    if (node.radius < 0.9) comparisons.push('Smaller than Earth')
    else if (node.radius <= 1.25) comparisons.push('Earth-sized')
    else if (node.radius <= 2.2) comparisons.push('Super-Earth')
    else comparisons.push('Much larger than Earth')
  }
  if (node.temperature) {
    const earthTemp = 288
    const diff = node.temperature - earthTemp
    if (Math.abs(diff) < 30) comparisons.push('Similar temperature')
    else if (diff > 0) comparisons.push(`${diff}K warmer`)
    else comparisons.push(`${Math.abs(diff)}K cooler`)
  }
  if (node.orbitalPeriod) {
    const days = parseFloat(node.orbitalPeriod)
    if (days < 10) comparisons.push('Much shorter year')
    else if (days > 300 && days < 400) comparisons.push('Similar year length')
    else if (days > 400) comparisons.push('Longer year')
    else comparisons.push('Shorter year')
  }
  return comparisons.length > 0 ? comparisons.join(' · ') : 'Limited comparison data'
}

function buildExoplanetLenses(node, neighbors) {
  const relatedMissions = neighbors.filter(neighbor => neighbor.type === 'mission')
  const relatedMissionNames = relatedMissions.map(neighbor => neighbor.name)

  return [
    {
      id: 'discovery',
      title: 'Discovery',
      icon: 'D',
      summary: `${node.name} was identified in ${node.discoveryYear ?? 'an unknown year'} using ${node.method ?? 'an unknown method'}, giving it a clear place in the story of how we learned this system exists.`,
      prompt: `Focus on the discovery story for ${node.name}. Explain how astronomers found it, why that method matters, and what made the detection notable.`,
      whyItMatters: node.discoveryYear
        ? `Discovered in ${node.discoveryYear}, ${node.name} expanded what we knew was possible at the time and shaped the questions astronomers asked next.`
        : `Every new world challenges or confirms our models of how planets form and where they can survive.`,
      facts: [
        { label: 'Year', value: node.discoveryYear ?? 'Unknown' },
        { label: 'Method', value: node.method ?? 'Unknown' },
        { label: 'Host star', value: node.hostStar ?? 'Unknown' },
        { label: 'Distance', value: node.distance ? `${node.distance} ly` : 'Unknown' },
      ],
      context: node.discoveryYear
        ? `In ${node.discoveryYear}, exoplanet science was ${node.discoveryYear < 2000 ? 'just beginning — fewer than 50 worlds were known' : node.discoveryYear < 2010 ? 'accelerating — hundreds of candidates were piling up' : 'maturing — thousands of worlds gave us a statistical picture'}.`
        : null,
      questions: [
        `What follow-up observations confirmed ${node.name}'s existence?`,
        `How did the detection method shape what we know (and don't know) about this world?`,
      ],
    },
    {
      id: 'earth-comparison',
      title: 'Earth Comparison',
      icon: 'E',
      summary: `${node.name} has ${formatRadius(node.radius)}${node.mass ? ` and a mass of ${node.mass} Earth masses` : ''}, which makes it easiest to understand by comparing where it sits relative to Earth-sized rocky worlds.`,
      prompt: `Compare ${node.name} to Earth in plain language. Cover size, likely conditions, and whether the comparison is actually meaningful or misleading.`,
      whyItMatters: `Comparing to Earth is the fastest way to build intuition, but it can mislead — size alone does not predict whether a world is rocky, gaseous, or something in between.`,
      facts: [
        { label: 'Radius', value: node.radius ? `${node.radius}× Earth` : 'Unknown' },
        { label: 'Mass', value: node.mass ? `${node.mass}× Earth` : 'Unknown' },
        { label: 'Temperature', value: node.temperature ? `${node.temperature} K` : 'Unknown' },
        { label: 'Year length', value: node.orbitalPeriod ?? 'Unknown' },
        { label: 'Earth temp', value: '288 K' },
      ],
      context: getEarthComparison(node),
      questions: [
        `Is the Earth comparison actually useful for ${node.name}, or does it mislead?`,
        `What would standing on the surface feel like compared to Earth?`,
      ],
    },
    {
      id: 'habitability',
      title: 'Habitability',
      icon: 'H',
      summary: `${node.habitability ?? `${node.name} is interesting from a habitability perspective because of its orbit, size, and temperature.`} ${getTemperatureTone(node.temperature)}`,
      prompt: `Evaluate the habitability case for ${node.name}. Explain what helps, what hurts, and what scientists would still need to know before treating it as a serious life candidate.`,
      whyItMatters: node.temperature && node.temperature >= 200 && node.temperature <= 350
        ? `${node.name}'s temperature puts it in the range where liquid water could exist — the single most important factor in our current understanding of life.`
        : `Even worlds outside the classic habitable zone teach us about the boundaries of where life might be possible.`,
      facts: [
        { label: 'Temperature', value: node.temperature ? `${node.temperature} K` : 'Unknown' },
        { label: 'Zone', value: getTemperatureLabel(node.temperature) },
        { label: 'Radius', value: node.radius ? `${node.radius}× Earth` : 'Unknown' },
        { label: 'Star type', value: node.hostStar ?? 'Unknown' },
      ],
      context: node.habitability ?? null,
      questions: [
        `Could liquid water exist on the surface of ${node.name}?`,
        `What atmospheric measurements would settle the habitability question?`,
      ],
    },
    {
      id: 'extremes',
      title: 'Extremes',
      icon: 'X',
      summary: getExtremesCopy(node),
      prompt: `Describe the most extreme or unusual trait of ${node.name} and why astronomers find that trait scientifically useful, not just dramatic.`,
      whyItMatters: `Extreme worlds are natural laboratories — they push physical models to their limits and reveal processes that milder planets hide.`,
      facts: [
        { label: 'Key trait', value: getExtremeTrait(node) },
        { label: 'Temperature', value: node.temperature ? `${node.temperature} K` : 'Unknown' },
        { label: 'Orbit', value: node.orbitalPeriod ?? 'Unknown' },
        { label: 'Mass', value: formatMass(node.mass) ?? 'Unknown' },
      ],
      context: null,
      questions: [
        `What physical process makes ${node.name}'s extreme trait possible?`,
        `How does this extreme help us understand more "normal" planets?`,
      ],
    },
    {
      id: 'related-missions',
      title: 'Related Missions',
      icon: 'R',
      summary: relatedMissionNames.length > 0
        ? `${formatList(relatedMissionNames)} ${relatedMissionNames.length === 1 ? 'is' : 'are'} the mission${relatedMissionNames.length === 1 ? '' : 's'} directly tied to ${node.name} in this map, connecting the world to the instruments that found or studied it.`
        : `${node.name} has no direct mission neighbors in the current curated graph, which makes that connection itself a good thing to investigate later.`,
      prompt: `Explain how the missions connected to ${node.name} shaped what we know about it, and what each mission added to the picture.`,
      whyItMatters: relatedMissionNames.length > 0
        ? `No planet is discovered in isolation — ${formatList(relatedMissionNames)} each contributed a different piece of the puzzle.`
        : `Understanding which instruments could study ${node.name} reveals what's possible and what's still out of reach.`,
      facts: relatedMissions.map(m => ({
        label: m.name,
        value: m.method ?? m.status ?? 'Connected',
      })),
      context: relatedMissions.length > 1
        ? `${node.name} has been studied by ${relatedMissions.length} missions, giving it a richer dataset than most exoplanets.`
        : null,
      questions: [
        `What did each mission specifically contribute to our understanding of ${node.name}?`,
        `Which future instruments could add the most to what we know?`,
      ],
    },
    {
      id: 'open-questions',
      title: 'Open Questions',
      icon: '?',
      summary: getOpenQuestionCopy(node),
      prompt: `What are the biggest unanswered questions about ${node.name}? Keep it grounded in the current measurements and explain what future observations could settle.`,
      whyItMatters: `Open questions are not gaps in knowledge — they are the frontier, and they define what the next generation of telescopes will prioritize.`,
      facts: [
        { label: 'Mass known', value: node.mass ? 'Yes' : 'No' },
        { label: 'Radius known', value: node.radius ? 'Yes' : 'No' },
        { label: 'Temp known', value: node.temperature ? 'Yes' : 'No' },
        { label: 'Atmosphere', value: 'Unknown' },
      ],
      context: null,
      questions: [
        `What is the single most important measurement still missing for ${node.name}?`,
        `Which telescope or method is most likely to answer it?`,
      ],
    },
  ].filter(lens => lens.summary.trim() && lens.prompt.trim())
}

function buildMissionLenses(node, neighbors) {
  const relatedWorlds = neighbors.filter(neighbor => neighbor.type === 'exoplanet')
  const relatedWorldNames = relatedWorlds.slice(0, 3).map(neighbor => neighbor.name)

  return [
    {
      id: 'mission-role',
      title: 'Mission Role',
      icon: 'M',
      summary: `${node.name} sits in the map as a ${node.status ? node.status.toLowerCase() : 'mission'} ${node.agency ? `run by ${node.agency}` : ''} that expanded our ability to find or study exoplanets.`,
      prompt: `Describe the role ${node.name} plays in exoplanet science. Focus on what it was built to do and where it fits in the bigger discovery pipeline.`,
      whyItMatters: `${node.name} represents a specific capability in the exoplanet toolkit — without it, certain kinds of discoveries would have been delayed or missed entirely.`,
      facts: [
        { label: 'Agency', value: node.agency ?? 'Unknown' },
        { label: 'Launched', value: node.launchYear ?? 'Unknown' },
        { label: 'Status', value: node.status ?? 'Unknown' },
        { label: 'Method', value: node.method ?? 'Unknown' },
      ],
      context: node.contribution ?? null,
      questions: [
        `What gap did ${node.name} fill in the exoplanet discovery pipeline?`,
        `How did it change the questions astronomers could ask?`,
      ],
    },
    {
      id: 'detection-method',
      title: 'Detection Method',
      icon: 'T',
      summary: `${node.name} is most associated here with ${node.method ?? 'a broad set of observing methods'}, which defines the kind of signals it can pull out of distant star systems.`,
      prompt: `Explain the main observing method behind ${node.name} and why that method is powerful for finding or characterizing planets.`,
      whyItMatters: `The detection method determines what we can learn — transit photometry gives size, radial velocity gives mass, spectroscopy gives atmosphere. Each has blind spots.`,
      facts: [
        { label: 'Primary method', value: node.method ?? 'Unknown' },
        { label: 'Discoveries', value: node.discoveryCount?.toLocaleString() ?? 'Unknown' },
        { label: 'Best for', value: node.method?.includes('Transit') ? 'Planet size & atmosphere' : node.method?.includes('Radial') ? 'Planet mass' : 'Characterization' },
      ],
      context: null,
      questions: [
        `What kinds of planets can ${node.name}'s method easily miss?`,
        `How does this method complement other detection techniques?`,
      ],
    },
    {
      id: 'signature-discoveries',
      title: 'Signature Discoveries',
      icon: 'S',
      summary: relatedWorldNames.length > 0
        ? `${formatList(relatedWorldNames)} give ${node.name} a concrete set of signature worlds in this map, showing the range of planets it helped reveal.`
        : `${node.name} has no exoplanet neighbors in the current curation, so its signature value is more about capability than individual worlds here.`,
      prompt: `Walk through the headline worlds tied to ${node.name} in this dataset and explain why those examples represent the mission well.`,
      whyItMatters: relatedWorldNames.length > 0
        ? `These worlds are not just data points — they are the stories that defined ${node.name}'s public legacy and shaped future mission designs.`
        : `A mission's impact is not always measured in individual planet names — sometimes it is the statistical picture that matters most.`,
      facts: relatedWorlds.slice(0, 4).map(w => ({
        label: w.name,
        value: w.discoveryYear ? `Found ${w.discoveryYear}` : w.method ?? 'Connected',
      })),
      context: relatedWorlds.length > 0
        ? `${node.name} connects to ${relatedWorlds.length} world${relatedWorlds.length === 1 ? '' : 's'} in this map, from ${relatedWorlds.map(w => w.name).join(' to ')}.`
        : null,
      questions: [
        `Which discovery best represents what ${node.name} was built to find?`,
        `Were there any surprising or unexpected finds?`,
      ],
    },
    {
      id: 'legacy',
      title: 'Legacy',
      icon: 'L',
      summary: node.discoveryCount
        ? `${node.name} is credited here with ${node.discoveryCount.toLocaleString()} discoveries, which gives it a strong legacy in shifting exoplanets from rare curiosities to a statistical reality.`
        : `${node.name}'s legacy is less about raw counts and more about the kind of observation it made possible.`,
      prompt: `Explain the long-term legacy of ${node.name}. What changed in exoplanet science because this mission existed?`,
      whyItMatters: node.discoveryCount
        ? `${node.discoveryCount.toLocaleString()} discoveries did not just add to a list — they transformed exoplanet science from counting individual worlds to understanding populations.`
        : `Some missions are remembered not for how many planets they found, but for what they proved was possible.`,
      facts: [
        { label: 'Discoveries', value: node.discoveryCount?.toLocaleString() ?? 'N/A' },
        { label: 'Years active', value: node.launchYear ? `Since ${node.launchYear}` : 'Unknown' },
        { label: 'Status', value: node.status ?? 'Unknown' },
      ],
      context: node.contribution ?? null,
      questions: [
        `What changed in exoplanet science specifically because ${node.name} existed?`,
        `Is ${node.name}'s legacy primarily about quantity or about quality of discovery?`,
      ],
    },
    {
      id: 'why-it-matters',
      title: 'Why It Matters',
      icon: 'W',
      summary: node.contribution
        ? node.contribution
        : `${node.name} matters because it pushed the frontier of what astronomers could measure beyond simple detection.`,
      prompt: `Make the case for why ${node.name} matters in the history of exoplanet science, using concrete consequences instead of generic praise.`,
      whyItMatters: `The question is not whether ${node.name} contributed — it is what specific door it opened that no other instrument could.`,
      facts: [
        { label: 'Agency', value: node.agency ?? 'Unknown' },
        { label: 'Method', value: node.method ?? 'Unknown' },
        { label: 'Discoveries', value: node.discoveryCount?.toLocaleString() ?? 'Unknown' },
      ],
      context: node.contribution ?? null,
      questions: [
        `What would be different today if ${node.name} had never launched?`,
        `How did ${node.name} influence the design of missions that followed it?`,
      ],
    },
    {
      id: 'open-questions',
      title: 'Open Questions',
      icon: '?',
      summary: `The next question for ${node.name} is not whether it worked, but what observations should follow it next and which worlds deserve deeper follow-up.`,
      prompt: `What open questions does ${node.name} leave behind for later missions or follow-up instruments to answer?`,
      whyItMatters: `Every mission answers some questions and creates new ones — the open questions define the roadmap for what comes next.`,
      facts: [
        { label: 'Status', value: node.status ?? 'Unknown' },
        { label: 'Method', value: node.method ?? 'Unknown' },
        { label: 'Worlds linked', value: `${relatedWorlds.length}` },
      ],
      context: null,
      questions: [
        `What specific follow-up observations would ${node.name}'s discoveries benefit most from?`,
        `Which next-generation instrument is best positioned to continue this work?`,
      ],
    },
  ].filter(lens => lens.summary.trim() && lens.prompt.trim())
}

export function getFocusLenses(node, neighbors = []) {
  if (!node) return []
  if (node.type === 'mission') return buildMissionLenses(node, neighbors)
  return buildExoplanetLenses(node, neighbors)
}

export function getFocusNodeSubtitle(node) {
  if (!node) return ''
  if (node.type === 'mission') {
    const pieces = [node.agency, node.launchYear && `launched ${node.launchYear}`].filter(Boolean)
    return pieces.join(' | ')
  }

  const pieces = [node.hostStar, node.method, formatTemperature(node.temperature)].filter(Boolean)
  return pieces.join(' | ')
}
