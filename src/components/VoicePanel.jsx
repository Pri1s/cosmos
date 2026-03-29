import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildVoiceNarration } from '../utils/voice-narration'
import {
  getVoiceNarrationText,
  isSpeechSynthesisSupported,
  pickNarrationVoice,
} from '../utils/voice-speech'

const WAVE_BARS = [14, 22, 18, 28, 16, 24, 12, 20, 26, 15]
const SPEECH_RATE = 0.96
const SPEECH_PITCH = 1.02

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
    speechSupported ? 'queued' : 'unavailable'
  )
  const utteranceRef = useRef(null)
  const speechText = getVoiceNarrationText(narration)
  const isSpeaking = speechState === 'queued' || speechState === 'speaking'
  const liveLabel = speechState === 'unavailable'
    ? 'Silent'
    : isSpeaking
      ? 'Live'
      : 'Ready'

  const stopSpeech = useCallback(() => {
    if (!speechSupported) return
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setSpeechState('idle')
  }, [speechSupported])

  const startSpeech = useCallback(() => {
    if (!speechSupported || !speechText) return

    const synth = window.speechSynthesis
    const utterance = new window.SpeechSynthesisUtterance(speechText)
    const voice = pickNarrationVoice(synth.getVoices())

    if (voice) utterance.voice = voice
    utterance.rate = SPEECH_RATE
    utterance.pitch = SPEECH_PITCH
    utterance.onstart = () => setSpeechState('speaking')
    utterance.onend = () => {
      utteranceRef.current = null
      setSpeechState('idle')
    }
    utterance.onerror = () => {
      utteranceRef.current = null
      setSpeechState('idle')
    }

    utteranceRef.current = utterance
    synth.cancel()
    synth.speak(utterance)
  }, [speechSupported, speechText])

  useEffect(() => {
    if (!speechSupported || !speechText) return undefined

    startSpeech()

    return () => {
      window.speechSynthesis.cancel()
      utteranceRef.current = null
    }
  }, [speechSupported, speechText, startSpeech])

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
            <span className="voice-panel__channel">{narration.channel}</span>
            <button
              type="button"
              className="voice-panel__toggle"
              onClick={isSpeaking ? stopSpeech : startSpeech}
              onPointerDown={(event) => event.stopPropagation()}
              disabled={!speechSupported}
            >
              {!speechSupported ? 'Voice unavailable' : isSpeaking ? 'Stop voice' : 'Replay voice'}
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
