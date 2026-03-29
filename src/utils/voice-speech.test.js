import { describe, expect, it } from 'vitest'
import {
  getVoicePlaybackView,
  getVoiceNarrationText,
  hasVoiceNarrationChanged,
  isSpeechSynthesisSupported,
  pickNarrationVoice,
  scoreNarrationVoice,
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

  it('only treats changed narration text as a playback reset trigger', () => {
    expect(hasVoiceNarrationChanged('First line. Second line.', 'First line. Second line.')).toBe(false)
    expect(hasVoiceNarrationChanged(' First line. Second line. ', 'First line. Second line.')).toBe(false)
    expect(hasVoiceNarrationChanged('First line. Second line.', 'First line. Third line.')).toBe(true)
  })

  it('maps playback states to the correct voice panel labels', () => {
    expect(getVoicePlaybackView('idle')).toEqual({
      isSpeaking: false,
      liveLabel: 'Ready',
      toggleLabel: 'Start narration',
    })

    expect(getVoicePlaybackView('speaking')).toEqual({
      isSpeaking: true,
      liveLabel: 'Live',
      toggleLabel: 'Stop voice',
    })

    expect(getVoicePlaybackView('unavailable')).toEqual({
      isSpeaking: false,
      liveLabel: 'Silent',
      toggleLabel: 'Voice unavailable',
    })
  })

  it('prefers natural english female guide voices over generic options', () => {
    const voices = [
      { name: 'Deutsch', lang: 'de-DE' },
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US' },
      { name: 'Google UK English Male', lang: 'en-GB' },
    ]

    expect(pickNarrationVoice(voices)).toEqual({
      name: 'Microsoft Aria Online (Natural) - English (United States)',
      lang: 'en-US',
    })
  })

  it('scores female narration voices above male or non-english voices', () => {
    const aria = {
      name: 'Microsoft Aria Online (Natural) - English (United States)',
      lang: 'en-US',
    }
    const male = {
      name: 'Google UK English Male',
      lang: 'en-GB',
    }
    const german = {
      name: 'Deutsch',
      lang: 'de-DE',
    }

    expect(scoreNarrationVoice(aria)).toBeGreaterThan(scoreNarrationVoice(male))
    expect(scoreNarrationVoice(male)).toBeGreaterThan(scoreNarrationVoice(german))
  })
})
