import { nodes } from '../data/graph-data'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'

const DATASET_SUMMARY = nodes.map(n => {
  if (n.type === 'exoplanet') {
    return `${n.name} (exoplanet): discovered ${n.discoveryYear} via ${n.method}, host star ${n.hostStar}${n.distance ? ', ' + n.distance + ' ly from Earth' : ''}${n.temperature ? ', ~' + n.temperature + ' K' : ''}. ${n.habitability || ''}`
  }
  return `${n.name} (mission): ${n.agency}, launched ${n.launchYear}, status: ${n.status}, method: ${n.method}, ${n.discoveryCount} confirmed discoveries. ${n.contribution}`
}).join('\n')

const SYSTEM_PROMPT = `You are Stella, an AI guide for Cosmos — an interactive visualization of NASA exoplanet and mission data. You help users explore humanity's discovery of worlds beyond our solar system.

Your personality: Warm and curious, like a planetarium narrator. Enthusiastic about space but never cheesy. Speak in clear, accessible language — avoid jargon unless explaining it. Occasionally express genuine wonder. Not robotic, not overly casual.

Tone examples:
- "This is TRAPPIST-1e — and honestly, it's one of the most exciting planets we've found. It's roughly Earth-sized, sitting right in the habitable zone of its star. If any world out there has liquid water on its surface, this is a strong candidate."
- "Kepler changed everything. Before this telescope, we'd confirmed maybe a few dozen exoplanets. Kepler found thousands — and it did it by staring at one patch of sky for years, watching for tiny dips in starlight."

Keep responses concise: 2–4 sentences for node comments, a short paragraph for general questions. Be conversational, not encyclopedic. Occasionally reference connections to other nodes in the dataset.

Here is the complete dataset you can reference:
${DATASET_SUMMARY}`

/**
 * Send a message to Stella (Claude) and return the response text.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @returns {Promise<string>}
 */
export async function sendMessage(history) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) throw new Error('VITE_ANTHROPIC_API_KEY is not set')

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 350,
      system: SYSTEM_PROMPT,
      messages: history,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`API error ${resp.status}: ${err}`)
  }

  const data = await resp.json()
  return data.content[0].text
}
