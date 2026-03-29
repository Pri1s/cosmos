function formatList(items) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function estimateDuration(transcript) {
  const words = transcript.join(' ').trim().split(/\s+/).filter(Boolean).length
  const totalSeconds = Math.max(42, Math.round(words / 2.35))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function buildNodeOpening(node) {
  if (node.type === 'mission') {
    return `${node.name} enters the scene as ${node.agency ? `${node.agency}'s ` : 'a '}mission${node.launchYear ? ` launched in ${node.launchYear}` : ''}, built to widen the reach of exoplanet discovery rather than just add one more telescope to the sky.`
  }

  return `${node.name} is the kind of world that pulls focus immediately${node.hostStar ? `, orbiting ${node.hostStar}` : ''}${node.discoveryYear ? ` and stepping into the catalog in ${node.discoveryYear}` : ''}.`
}

function buildNodeMiddle(node, lens) {
  if (lens) {
    const whyItMatters = lens.whyItMatters ? ` ${lens.whyItMatters}` : ''
    return `${lens.summary}${whyItMatters}`
  }

  if (node.type === 'mission') {
    return node.contribution
      ? `${node.contribution} In Cosmos, that makes ${node.name} less of a background instrument and more of a hinge point in the larger story of how exoplanet science matured.`
      : `${node.name} matters because missions like this decide what signals astronomers can actually trust, repeat, and scale.`
  }

  const temperature = node.temperature ? ` At roughly ${node.temperature} K, its environment immediately sets the tone for how scientists talk about it.` : ''
  const habitability = node.habitability ? ` ${node.habitability}` : ''
  return `${node.name} is defined by a mix of scale, orbit, and detectability rather than one single measurement.${temperature}${habitability}`
}

function buildNodeClosing(node, lens, neighbors) {
  const relatedNames = neighbors.slice(0, 3).map((neighbor) => neighbor.name)

  if (relatedNames.length > 0) {
    return lens
      ? `That ${lens.title.toLowerCase()} angle lands differently once you place ${node.name} beside ${formatList(relatedNames)}. The point is not just what this node is, but how it changes the meaning of the nodes around it.`
      : `${node.name} becomes more legible when you set it beside ${formatList(relatedNames)}. In this map, the surrounding links are part of the story, not decoration.`
  }

  return lens
    ? `Even without a dense local neighborhood, the ${lens.title.toLowerCase()} view shows why ${node.name} earns space in the map.`
    : `${node.name} stands on its own here, which makes the unanswered questions around it feel even sharper.`
}

function buildSignalSummary(node, lens) {
  if (lens) return `${lens.title} channel`
  return node.type === 'mission' ? 'Mission overview channel' : 'World overview channel'
}

function buildCueLabels(node, lens, neighbors) {
  const labels = lens
    ? [lens.title, lens.facts?.[0]?.label, neighbors[0]?.name]
    : [
        node.type === 'mission' ? 'Mission arc' : 'World profile',
        node.method ?? null,
        neighbors[0]?.name ?? null,
      ]

  return labels.filter(Boolean).slice(0, 3)
}

export function buildVoiceNarration(node, lens = null, neighbors = []) {
  if (!node) return null

  const transcript = [
    buildNodeOpening(node),
    buildNodeMiddle(node, lens),
    buildNodeClosing(node, lens, neighbors),
  ]

  return {
    channel: buildSignalSummary(node, lens),
    title: lens ? `Narrating ${lens.title}` : `Narrating ${node.name}`,
    subtitle: lens
      ? `${node.name} through Stella's ${lens.title.toLowerCase()} lens`
      : `Stella's live read on ${node.name}`,
    duration: estimateDuration(transcript),
    cues: buildCueLabels(node, lens, neighbors),
    transcript,
  }
}
