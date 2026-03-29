export function isSpeechSynthesisSupported(target = globalThis) {
  return Boolean(
    target?.speechSynthesis &&
    typeof target?.SpeechSynthesisUtterance === 'function'
  )
}

export function getVoiceNarrationText(narration) {
  return narration?.transcript?.join(' ') ?? ''
}

export function hasVoiceNarrationChanged(previousText = '', nextText = '') {
  return previousText.trim() !== nextText.trim()
}

export function getVoicePlaybackView(speechState = 'idle') {
  const isSpeaking = speechState === 'queued' || speechState === 'speaking'

  if (speechState === 'unavailable') {
    return {
      isSpeaking: false,
      liveLabel: 'Silent',
      toggleLabel: 'Voice unavailable',
    }
  }

  return {
    isSpeaking,
    liveLabel: isSpeaking ? 'Live' : 'Ready',
    toggleLabel: isSpeaking ? 'Stop voice' : 'Start narration',
  }
}

const ENGLISH_GUIDE_LANG_RE = /^en(-|_)/i
const NATURAL_TOKENS_RE = /natural|neural|premium|enhanced|wavenet|studio|online/i
const FEMALE_GUIDE_TOKENS_RE = /female|woman|aria|ava|jenny|samantha|serena|allison|karen|moira|sara|sonia|libby|joanna|kendra|ivy|salli|emma|zira/i
const STRONG_GUIDE_TOKENS_RE = /aria|ava|jenny|samantha|serena|allison|sonia|libby/i
const MALE_TOKENS_RE = /male|man|david|guy|brian|steffan|christopher|alex|daniel|mark/i
const NON_GUIDE_TOKENS_RE = /child|kid|news|whisper/i

export function scoreNarrationVoice(voice = {}) {
  const name = voice.name ?? ''
  const lang = voice.lang ?? ''
  let score = 0

  if (ENGLISH_GUIDE_LANG_RE.test(lang)) {
    score += 40
  } else if (lang) {
    score -= 12
  }

  if (/en-us/i.test(lang)) score += 12
  if (/en-gb/i.test(lang)) score += 10
  if (voice.default) score += 4
  if (voice.localService) score += 3

  if (NATURAL_TOKENS_RE.test(name)) score += 24
  if (FEMALE_GUIDE_TOKENS_RE.test(name)) score += 36
  if (STRONG_GUIDE_TOKENS_RE.test(name)) score += 10

  if (MALE_TOKENS_RE.test(name)) score -= 30
  if (NON_GUIDE_TOKENS_RE.test(name)) score -= 18

  return score
}

export function pickNarrationVoice(voices = []) {
  if (!Array.isArray(voices) || voices.length === 0) return null

  return [...voices]
    .sort((left, right) => scoreNarrationVoice(right) - scoreNarrationVoice(left))
    .at(0) ?? null
}
