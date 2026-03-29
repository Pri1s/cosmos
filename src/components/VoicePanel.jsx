import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildVoiceNarration } from '../utils/voice-narration'
import {
  getVoicePlaybackView,
  getVoiceNarrationText,
  hasVoiceNarrationChanged,
  isSpeechSynthesisSupported,
  pickNarrationVoice,
} from '../utils/voice-speech'

const WAVE_BARS = [14, 22, 18, 28, 16, 24, 12, 20, 26, 15]
const SPEECH_RATE = 0.92
const SPEECH_PITCH = 0.98

export default function VoicePanel({
  node,
  lens,
  neighbors = [],
  floating = false,
  floatingStyle,
  onDragStart,
  onResizeStart,
  isInteracting = false,
}) {
  const narration = useMemo(
    () => buildVoiceNarration(node, lens, neighbors),
    [lens, neighbors, node]
  )
  const speechSupported = useMemo(() => isSpeechSynthesisSupported(), [])
  const [speechState, setSpeechState] = useState(
    speechSupported ? 'idle' : 'unavailable'
  )
  const [availableVoices, setAvailableVoices] = useState(() => (
    speechSupported ? window.speechSynthesis.getVoices() : []
  ))
  const utteranceRef = useRef(null)
  const previousSpeechTextRef = useRef(getVoiceNarrationText(narration))
  const speechText = getVoiceNarrationText(narration)
  const selectedVoice = useMemo(
    () => pickNarrationVoice(availableVoices),
    [availableVoices]
  )
  const { isSpeaking, liveLabel, toggleLabel } = useMemo(
    () => getVoicePlaybackView(speechState),
    [speechState]
  )

  const clearUtteranceHandlers = useCallback((utterance) => {
    if (!utterance) return

    utterance.onstart = null
    utterance.onend = null
    utterance.onerror = null
  }, [])

  const stopSpeech = useCallback(() => {
    if (!speechSupported) return

    clearUtteranceHandlers(utteranceRef.current)
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setSpeechState('idle')
  }, [clearUtteranceHandlers, speechSupported])

  const startSpeech = useCallback(() => {
    if (!speechSupported || !speechText) return

    const synth = window.speechSynthesis

    clearUtteranceHandlers(utteranceRef.current)
    synth.cancel()

    const utterance = new window.SpeechSynthesisUtterance(speechText)
    const voice = selectedVoice ?? pickNarrationVoice(synth.getVoices())

    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang ?? 'en-US'
    utterance.rate = SPEECH_RATE
    utterance.pitch = SPEECH_PITCH
    utterance.onstart = () => {
      if (utteranceRef.current !== utterance) return
      setSpeechState('speaking')
    }
    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return
      utteranceRef.current = null
      setSpeechState('idle')
    }
    utterance.onerror = () => {
      if (utteranceRef.current !== utterance) return
      utteranceRef.current = null
      setSpeechState('idle')
    }

    utteranceRef.current = utterance
    setSpeechState('queued')
    synth.speak(utterance)
  }, [clearUtteranceHandlers, selectedVoice, speechSupported, speechText])

  useEffect(() => {
    if (!speechSupported) return undefined

    const synth = window.speechSynthesis
    const syncVoices = () => {
      const nextVoices = synth.getVoices()
      if (nextVoices.length > 0) {
        setAvailableVoices(nextVoices)
      }
    }

    syncVoices()

    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', syncVoices)
      return () => synth.removeEventListener('voiceschanged', syncVoices)
    }

    const previousHandler = synth.onvoiceschanged
    synth.onvoiceschanged = syncVoices
    return () => {
      synth.onvoiceschanged = previousHandler ?? null
    }
  }, [speechSupported])

  useEffect(() => {
    if (!speechSupported) return undefined

    return () => {
      clearUtteranceHandlers(utteranceRef.current)
      window.speechSynthesis.cancel()
      utteranceRef.current = null
    }
  }, [clearUtteranceHandlers, speechSupported])

  useEffect(() => {
    if (!speechSupported) {
      previousSpeechTextRef.current = speechText
      return undefined
    }

    if (!hasVoiceNarrationChanged(previousSpeechTextRef.current, speechText)) return undefined

    previousSpeechTextRef.current = speechText

    clearUtteranceHandlers(utteranceRef.current)
    window.speechSynthesis.cancel()
    utteranceRef.current = null

    const resetTimer = window.setTimeout(() => {
      setSpeechState('idle')
    }, 0)

    return () => window.clearTimeout(resetTimer)
  }, [clearUtteranceHandlers, speechSupported, speechText])

  if (!narration) return null

  return (
    <aside
      className={`voice-panel ${floating ? 'voice-panel--floating' : ''} ${isInteracting ? 'is-interacting' : ''}`}
      style={floatingStyle}
    >
      <div
        className={`voice-panel__header ${floating ? 'voice-panel__header--draggable' : ''}`}
        onPointerDown={floating ? onDragStart : undefined}
      >
        <div>
          <div className="voice-panel__eyebrow">Stella Voice</div>
          <h3 className="voice-panel__title">{narration.title}</h3>
          <p className="voice-panel__subtitle">{narration.subtitle}</p>
        </div>
        <div className="voice-panel__meta">
          <span className={`voice-panel__live ${isSpeaking ? 'is-live' : ''}`}>
            <span className="voice-panel__live-dot" />
            {liveLabel}
          </span>
          <span className="voice-panel__duration">{narration.duration}</span>
        </div>
      </div>

      <div className="voice-panel__body">
        <div className="voice-panel__console">
          <div className="voice-panel__waveform" aria-hidden="true">
            {WAVE_BARS.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className={`voice-panel__bar ${isSpeaking ? 'is-animated' : ''}`}
                style={{
                  '--voice-bar-height': `${height}px`,
                  '--voice-bar-delay': `${index * 0.08}s`,
                }}
              />
            ))}
          </div>
          <div className="voice-panel__channel-row">
            <span className="voice-panel__channel">
              {selectedVoice?.name ?? narration.channel}
            </span>
            <button
              type="button"
              className="voice-panel__toggle"
              onClick={isSpeaking ? stopSpeech : startSpeech}
              onPointerDown={(event) => event.stopPropagation()}
              disabled={!speechSupported || !speechText}
            >
              {toggleLabel}
            </button>
          </div>
        </div>

        <div className="voice-panel__transcript">
          {narration.transcript.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="voice-panel__cues">
          {narration.cues.map((cue) => (
            <span key={cue} className="voice-panel__cue">{cue}</span>
          ))}
        </div>
      </div>

      {floating && (
        <button
          type="button"
          className="floating-resize-handle"
          aria-label="Resize Stella voice panel"
          onPointerDown={onResizeStart}
        />
      )}
    </aside>
  )
}
