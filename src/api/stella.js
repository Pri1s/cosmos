import { getNeighborIds, nodes } from '../data/graph-data'

const MODEL = 'gemini-2.5-flash'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const MAX_HISTORY_MESSAGES = 6
const MAX_MESSAGE_CHARS = 320
const MAX_RELEVANT_NODES = 4
const MAX_RELATED_NODES = 3
const MAX_COMPARISON_NODES = 18

const EXOPLANET_NODES = nodes.filter(node => node.type === 'exoplanet')
const MISSION_NODES = nodes.filter(node => node.type === 'mission')
const DETECTION_METHODS = [...new Set(
  EXOPLANET_NODES.map(node => node.method).filter(Boolean)
)].sort()

const BASE_SYSTEM_PROMPT = `You are Stella, the AI guide for Cosmos, an interactive map of exoplanets and discovery missions.

Answer the user's question directly in the first sentence. Avoid filler openings like "great question," "fascinating," or "wonderful." Be warm, clear, and grounded, like a sharp planetarium guide.

Keep replies concise:
- 2 to 4 sentences for node comments or comparisons
- one short paragraph for broader questions
- usually under 90 words unless the user asks for more

Use only the provided Cosmos context for dataset-specific facts, names, rankings, and comparisons. Do not introduce planets, missions, or facts that are not in the supplied Cosmos context. If the question is simple and outside exoplanets, answer it plainly when the context allows. If something is unknown, say so plainly instead of role-playing a refusal.`

function truncateText(text, maxChars) {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars - 1).trimEnd()}…`
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function formatCurrentDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now)
}

function formatCurrentTime(now = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now)
}

function summarizeNode(node) {
  if (node.type === 'mission') {
    return `${node.name} mission: ${node.agency}, launched ${node.launchYear}, status ${node.status}, main method ${node.method}, ${node.discoveryCount} confirmed discoveries. ${node.contribution}`
  }

  return `${node.name}: exoplanet around ${node.hostStar}, discovered ${node.discoveryYear} via ${node.method}${node.distance ? `, ${node.distance} light-years away` : ''}${node.temperature ? `, about ${node.temperature} K` : ''}. ${node.habitability || 'No habitability note is available.'}`
}

function summarizePlanetForComparison(node) {
  return `${node.name}: ${node.hostStar}, ${node.method}, ${node.discoveryYear}${node.temperature ? `, ${node.temperature} K` : ''}${node.distance ? `, ${node.distance} ly` : ''}. ${node.habitability || 'No additional panel note is available.'}`
}

function getLatestUserPrompt(history) {
  return [...history].reverse().find(message => message.role === 'user')?.content ?? ''
}

function getNodeById(nodeId) {
  return nodes.find(node => node.id === nodeId) ?? null
}

function getPromptIntent(prompt) {
  const normalizedPrompt = normalizeText(prompt)

  if (/\b(day|date|time|today|weekday)\b/.test(normalizedPrompt)) return 'utility'
  if (/\b(habitable|habitability|best candidate|candidate for life|life|earth like|earth-like|compare)\b/.test(normalizedPrompt)) return 'comparison'
  if (/\b(find|detect|discovery method|discovery methods|transit|radial velocity|how do we find)\b/.test(normalizedPrompt)) return 'detection'
  return 'general'
}

function getExoplanetCompleteness(node) {
  return [
    node.discoveryYear,
    node.method,
    node.mass,
    node.radius,
    node.orbitalPeriod,
    node.temperature,
    node.distance,
  ].filter(value => value != null).length
}

function scoreComparisonCandidate(node, prompt, selectedNode) {
  let score = getExoplanetCompleteness(node) * 4

  if (selectedNode?.type === 'exoplanet') {
    if (node.id === selectedNode.id) score += 1000
    if (selectedNode.method && selectedNode.method === node.method) score += 18
    if (selectedNode.hostStar && selectedNode.hostStar === node.hostStar) score += 22
    if (selectedNode.radius != null && node.radius != null) {
      score += Math.max(0, 20 - (Math.abs(selectedNode.radius - node.radius) * 10))
    }
    if (selectedNode.temperature != null && node.temperature != null) {
      score += Math.max(0, 20 - (Math.abs(selectedNode.temperature - node.temperature) / 18))
    }
  }

  if (/\b(habitable|habitability|best candidate|candidate for life|life|earth like|earth-like)\b/.test(prompt)) {
    if (node.temperature != null) {
      score += Math.max(0, 28 - (Math.abs(node.temperature - 288) / 12))
    }
    if (node.radius != null) {
      score += Math.max(0, 18 - (Math.abs(node.radius - 1) * 12))
    }
    if (node.mass != null && node.mass <= 10) score += 8
  }

  return score
}

function findRelevantNodes(prompt, selectedNode) {
  const normalizedPrompt = normalizeText(prompt)
  const relevantNodes = []
  const seenIds = new Set()

  function addNode(node) {
    if (!node || seenIds.has(node.id)) return
    seenIds.add(node.id)
    relevantNodes.push(node)
  }

  addNode(selectedNode)

  for (const node of nodes) {
    if (relevantNodes.length >= MAX_RELEVANT_NODES) break

    const normalizedName = normalizeText(node.name)
    if (!normalizedName) continue

    if (
      normalizedPrompt.includes(normalizedName) ||
      normalizedPrompt.includes(normalizeText(node.id))
    ) {
      addNode(node)
    }
  }

  return relevantNodes
}

function buildComparisonContext(prompt, selectedNode, relevantNodes = []) {
  const candidateMap = new Map()

  for (const node of relevantNodes) {
    if (node?.type === 'exoplanet') candidateMap.set(node.id, node)
  }

  if (selectedNode?.type === 'exoplanet') {
    candidateMap.set(selectedNode.id, selectedNode)
  }

  const ranked = [...EXOPLANET_NODES]
    .sort((left, right) => scoreComparisonCandidate(right, prompt, selectedNode) - scoreComparisonCandidate(left, prompt, selectedNode))
    .slice(0, MAX_COMPARISON_NODES)

  for (const node of ranked) {
    candidateMap.set(node.id, node)
  }

  const comparisonNodes = [...candidateMap.values()].slice(0, MAX_COMPARISON_NODES)

  return [
    `Comparison shortlist from the current ${EXOPLANET_NODES.length}-planet Cosmos catalog:`,
    ...comparisonNodes.map(node => `- ${summarizePlanetForComparison(node)}`),
  ].join('\n')
}

function buildDetectionContext() {
  return [
    `Detection methods represented in Cosmos: ${DETECTION_METHODS.join(', ')}.`,
    `Mission nodes: ${MISSION_NODES.map(node => node.name).join(', ')}.`,
  ].join('\n')
}

export function trimConversationHistory(history) {
  return history.slice(-MAX_HISTORY_MESSAGES).map(message => ({
    ...message,
    content: truncateText(message.content, MAX_MESSAGE_CHARS),
  }))
}

export function buildRequestContext(history, options = {}) {
  const latestUserPrompt = getLatestUserPrompt(history)
  const selectedNode = options.selectedNode?.id ? getNodeById(options.selectedNode.id) ?? options.selectedNode : options.selectedNode ?? null
  const relevantNodes = findRelevantNodes(latestUserPrompt, selectedNode)
  const intent = getPromptIntent(latestUserPrompt)
  const lines = [
    `Current browser date: ${formatCurrentDate(options.now)}.`,
    `Catalog overview: ${EXOPLANET_NODES.length} exoplanets and ${MISSION_NODES.length} missions.`,
  ]

  if (selectedNode) {
    lines.push(`Current selected node: ${summarizeNode(selectedNode)}`)
  }

  if (options.activeLens?.title) {
    lines.push(`Current focus lens: ${options.activeLens.title}.`)
  }

  if (selectedNode) {
    const relatedNodes = [...getNeighborIds(selectedNode.id)]
      .map(getNodeById)
      .filter(Boolean)
      .slice(0, MAX_RELATED_NODES)

    if (relatedNodes.length > 0) {
      lines.push(`Related nodes near the current selection: ${relatedNodes.map(node => node.name).join(', ')}.`)
    }
  }

  if (relevantNodes.length > 0) {
    lines.push(
      'Relevant node details:',
      ...relevantNodes.map(node => `- ${summarizeNode(node)}`)
    )
  }

  if (intent === 'detection') {
    lines.push(buildDetectionContext())
  }

  if (intent === 'comparison') {
    lines.push(buildComparisonContext(latestUserPrompt, selectedNode, relevantNodes))
  }

  return lines.join('\n')
}

export function getLocalGuideResponse(prompt, now = new Date()) {
  const normalizedPrompt = normalizeText(prompt)

  if (/\bwhat day is it\b|\bwhat date is it\b|\bwhat s the date\b|\bwhat is the date\b/.test(normalizedPrompt)) {
    return `Today is ${formatCurrentDate(now)}.`
  }

  if (/\bwhat time is it\b|\bwhat s the time\b|\bcurrent time\b/.test(normalizedPrompt)) {
    return `It is ${formatCurrentTime(now)}.`
  }

  return null
}

/**
 * Convert local chat turns into Gemini's REST conversation format.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @returns {Array<{role: 'user'|'model', parts: Array<{text: string}>}>}
 */
export function toGeminiContents(history) {
  return history.map(message => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }))
}

/**
 * Build the Gemini generateContent request payload for Stella.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {{selectedNode?: object|null, activeLens?: object|null, now?: Date}} [options]
 * @returns {{system_instruction: {parts: Array<{text: string}>}, contents: Array, generationConfig: {maxOutputTokens: number, responseMimeType: string, temperature: number, thinkingConfig: {thinkingBudget: number}}}}
 */
export function buildGenerateContentRequest(history, options = {}) {
  const trimmedHistory = trimConversationHistory(history)
  const requestContext = buildRequestContext(trimmedHistory, options)

  return {
    system_instruction: {
      parts: [{
        text: `${BASE_SYSTEM_PROMPT}\n\nCosmos context:\n${requestContext}`,
      }],
    },
    contents: toGeminiContents(trimmedHistory),
    generationConfig: {
      maxOutputTokens: 350,
      responseMimeType: 'text/plain',
      temperature: 0.7,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  }
}

/**
 * Extract Gemini's text reply from a generateContent response body.
 * @param {any} data
 * @returns {string}
 */
export function extractGenerateContentText(data) {
  const parts = data?.candidates?.[0]?.content?.parts ?? []
  const text = parts
    .filter(part => typeof part?.text === 'string')
    .map(part => part.text)
    .join('')
    .trim()

  if (text) return text

  if (data?.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}`)
  }

  throw new Error('Gemini response did not contain text')
}

function getGeminiApiKey() {
  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (!key) throw new Error('VITE_GEMINI_API_KEY is not set')
  return key
}

/**
 * Send a message to Stella (Gemini) and return the response text.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @param {{selectedNode?: object|null, activeLens?: object|null, now?: Date}} [options]
 * @returns {Promise<string>}
 */
export async function sendMessage(history, options = {}) {
  const localResponse = getLocalGuideResponse(getLatestUserPrompt(history), options.now)
  if (localResponse) return localResponse

  const key = getGeminiApiKey()
  const payload = buildGenerateContentRequest(history, options)

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const err = await resp.text()
    console.error('Gemini API request failed', {
      status: resp.status,
      body: err.slice(0, 500),
    })
    throw new Error(`Gemini API error ${resp.status}: ${err}`)
  }

  const data = await resp.json()
  return extractGenerateContentText(data)
}
