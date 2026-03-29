import { describe, expect, it } from 'vitest'
import {
  getVoiceNarrationText,
  isSpeechSynthesisSupported,
  pickNarrationVoice,
} from './voice-speech'

describe('voice speech helpers', () => {
  it('detects browser speech synthesis support', () => {
    expect(isSpeechSynthesisSupported({
      speechSynthesis: {},
      SpeechSynthesisUtterance() {},
    })).toBe(true)

    expect(isSpeechSynthesisSupported({})).toBe(false)
  })

  it('joins transcript paragraphs into a single speech string', () => {
    expect(getVoiceNarrationText({
      transcript: ['First line.', 'Second line.'],
    })).toBe('First line. Second line.')
  })

  it('prefers english voices and voice names that sound like assistant narration', () => {
    const voices = [
      { name: 'Deutsch', lang: 'de-DE' },
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Google UK English Male', lang: 'en-GB' },
    ]

    expect(pickNarrationVoice(voices)).toEqual({ name: 'Samantha', lang: 'en-US' })
  })
})
