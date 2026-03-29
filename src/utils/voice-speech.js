export function isSpeechSynthesisSupported(target = globalThis) {
  return Boolean(
    target?.speechSynthesis &&
    typeof target?.SpeechSynthesisUtterance === 'function'
  )
}

export function getVoiceNarrationText(narration) {
  return narration?.transcript?.join(' ') ?? ''
}

export function pickNarrationVoice(voices = []) {
  if (!Array.isArray(voices) || voices.length === 0) return null

  const englishVoices = voices.filter((voice) => /^en(-|_)/i.test(voice.lang ?? ''))
  const preferredPool = englishVoices.length > 0 ? englishVoices : voices

  return preferredPool.find((voice) => /female|zira|samantha|ava|allison|serena|karen/i.test(voice.name ?? ''))
    ?? preferredPool.find((voice) => /en-us/i.test(voice.lang ?? ''))
    ?? preferredPool[0]
}
