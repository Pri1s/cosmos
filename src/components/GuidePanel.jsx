import { useState, useEffect, useRef, useCallback } from 'react'
import { sendMessage } from '../api/stella'

const WELCOME =
  "Welcome to Cosmos — a living atlas of worlds beyond our solar system. I'm Stella, your guide. Start the guided journey to walk through the full catalog, or click any node and ask me what stands out."

const NO_NODE_CHIPS = [
  {
    label: 'Surprise me',
    prompt: 'Tell me something fascinating about one of the planets or missions in this map. Pick whichever you find most remarkable.',
  },
  {
    label: 'Most habitable planet?',
    prompt: 'Which planet in this map is the best candidate for habitability, and why?',
  },
  {
    label: 'How do we find exoplanets?',
    prompt: 'How do astronomers actually detect planets orbiting other stars? What are the main methods?',
  },
]

function getNodeChips(node) {
  return [
    {
      label: 'What makes this special?',
      prompt: `What makes ${node.name} particularly interesting or unique compared to other worlds we've found?`,
    },
    {
      label: 'Compare to Earth',
      prompt: `How does ${node.name} compare to Earth in terms of size, conditions, and potential for life?`,
    },
    {
      label: "What's nearby?",
      prompt: `What other nodes or missions in this dataset are connected to ${node.name}, and why does that matter?`,
    },
    {
      label: 'Show me something cool',
      prompt: `Tell me the most surprising or unexpected fact about ${node.name}.`,
    },
  ]
}

const LENS_FOLLOW_UPS = {
  discovery: (node) => [
    { label: 'What method was used?', prompt: `Explain the detection method used to discover ${node.name} and how it works.` },
    { label: 'What came after discovery?', prompt: `What follow-up observations happened after ${node.name} was first detected?` },
  ],
  'earth-comparison': (node) => [
    { label: 'Could we live there?', prompt: `Based on what we know about ${node.name}, could humans hypothetically survive on its surface? What would conditions be like?` },
    { label: 'How does gravity compare?', prompt: `How would gravity on ${node.name} compare to Earth, and what would that mean for any life there?` },
  ],
  habitability: (node) => [
    { label: 'Is there water?', prompt: `What do we know or suspect about the presence of water on ${node.name}?` },
    { label: 'What about the atmosphere?', prompt: `What do we know about the atmosphere of ${node.name}, and what would make it habitable?` },
  ],
  extremes: (node) => [
    { label: 'How extreme is it?', prompt: `Put the extreme conditions on ${node.name} into context. How does it compare to the most extreme places in our solar system?` },
    { label: 'Could anything survive?', prompt: `Given the extreme conditions on ${node.name}, is there any conceivable way life could adapt?` },
  ],
  'related-missions': (node) => [
    { label: 'Which found the most?', prompt: `Of the missions connected to ${node.name}, which one contributed the most data and why?` },
    { label: 'What instruments were used?', prompt: `What specific instruments or techniques did the missions use to study ${node.name}?` },
  ],
  'open-questions': (node) => [
    { label: 'What observations are needed?', prompt: `What specific future observations would answer the biggest open questions about ${node.name}?` },
    { label: 'Which telescope could help?', prompt: `Which upcoming telescope or mission is best suited to resolve the open questions about ${node.name}?` },
  ],
  'mission-role': (node) => [
    { label: 'What made it unique?', prompt: `What set ${node.name} apart from other exoplanet missions in terms of its role and capabilities?` },
    { label: 'What came before it?', prompt: `What missions preceded ${node.name} and how did they set the stage for it?` },
  ],
  'detection-method': (node) => [
    { label: 'How does the method work?', prompt: `Explain in detail how the detection method used by ${node.name} works to find planets.` },
    { label: 'What are its limitations?', prompt: `What kinds of planets can ${node.name}'s detection method miss, and why?` },
  ],
  'signature-discoveries': (node) => [
    { label: 'What was the biggest find?', prompt: `What is considered the most significant individual discovery made by ${node.name}?` },
    { label: 'Any surprises?', prompt: `Did ${node.name} find anything unexpected or surprising that changed our understanding?` },
  ],
  legacy: (node) => [
    { label: 'What changed because of it?', prompt: `What specific things changed in exoplanet science as a direct result of ${node.name}?` },
    { label: 'Is it still relevant?', prompt: `Is ${node.name} still relevant today, or has it been fully superseded by newer missions?` },
  ],
  'why-it-matters': (node) => [
    { label: 'Why should I care?', prompt: `Explain why ${node.name} matters in a way that would resonate with someone new to exoplanet science.` },
    { label: 'Impact on future missions?', prompt: `How did ${node.name} influence the design or goals of missions that came after it?` },
  ],
}

function getFocusChips(node, activeLens) {
  if (!activeLens) {
    return [
      { label: 'Which lens first?', prompt: `I'm looking at ${node.name} in focus mode. Which knowledge lens would be the most interesting to start with, and why?` },
      { label: 'Quick overview', prompt: `Give me a concise overview of ${node.name} covering its key facts and why it matters.` },
      { label: 'Most interesting angle?', prompt: `What's the single most interesting thing about ${node.name} that would help me decide which angle to explore?` },
    ]
  }
  const generator = LENS_FOLLOW_UPS[activeLens.id]
  if (generator) return generator(node)
  return [
    { label: `More on ${activeLens.title.toLowerCase()}`, prompt: activeLens.prompt },
    { label: `Why does this matter?`, prompt: `Why is the ${activeLens.title.toLowerCase()} angle important for understanding ${node.name}?` },
  ]
}

const COLORS = { exoplanet: '#5ec4f7', mission: '#f76e5e' }

export default function GuidePanel({
  selectedNode,
  guideEvent,
  autoCommentEnabled = true,
  focusModeActive = false,
  activeLens = null,
  journeyStatus = 'idle',
  onStartJourney,
  onResumeJourney,
  onRestartJourney,
  floating = false,
  floatingStyle,
  onDragStart,
  onResizeStart,
  isInteracting = false,
}) {
  const [messages, setMessages] = useState([
    { id: 0, role: 'stella', text: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const conversationRef = useRef([])
  const prevNodeIdRef = useRef(null)
  const prevGuideEventIdRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /**
   * Core function: send a prompt to Stella, optionally displaying a user message bubble.
   * apiPrompt  — what gets sent to the API
   * displayText — if provided, shown as a user bubble in the chat
   */
  const sendToStella = useCallback(async (apiPrompt, displayText = null) => {
    if (displayText) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: displayText }])
    }
    setLoading(true)
    conversationRef.current = [...conversationRef.current, { role: 'user', content: apiPrompt }]

    try {
      const reply = await sendMessage(conversationRef.current, {
        selectedNode,
        activeLens,
        now: new Date(),
      })
      conversationRef.current = [...conversationRef.current, { role: 'assistant', content: reply }]
      setMessages(prev => [...prev, { id: Date.now(), role: 'stella', text: reply }])
    } catch (err) {
      const text = err.message?.includes('VITE_GEMINI_API_KEY')
        ? 'No API key found. Add VITE_GEMINI_API_KEY to your .env file to enable my responses.'
        : 'Sorry, I had trouble connecting. Please try again in a moment.'
      setMessages(prev => [...prev, { id: Date.now(), role: 'stella', text }])
    } finally {
      setLoading(false)
    }
  }, [activeLens, selectedNode])

  useEffect(() => {
    if (!guideEvent?.id || guideEvent.id === prevGuideEventIdRef.current) return
    prevGuideEventIdRef.current = guideEvent.id

    if (guideEvent.type === 'local-stella') {
      setMessages(prev => [...prev, { id: guideEvent.id, role: 'stella', text: guideEvent.text }])
      return
    }

    if (guideEvent.type === 'prompt-stella' && guideEvent.prompt) {
      sendToStella(guideEvent.prompt, guideEvent.displayText ?? null)
    }
  }, [guideEvent, sendToStella])

  // Auto-comment when user selects a node in map mode
  useEffect(() => {
    if (!selectedNode) {
      prevNodeIdRef.current = null
      return
    }
    if (!autoCommentEnabled) {
      prevNodeIdRef.current = selectedNode.id
      return
    }
    if (selectedNode.id === prevNodeIdRef.current) return
    prevNodeIdRef.current = selectedNode.id

    const prompt =
      selectedNode.type === 'mission'
        ? `The user just selected the mission "${selectedNode.name}" on the map. Here is its data: ${JSON.stringify(selectedNode)}. Give a brief, engaging 2–4 sentence comment about this mission and what it contributed to exoplanet science.`
        : `The user just selected the exoplanet "${selectedNode.name}" on the map. Here is its data: ${JSON.stringify(selectedNode)}. Give a brief, engaging 2–4 sentence comment about this world — what makes it interesting, notable, or worth exploring.`

    sendToStella(prompt)
  }, [autoCommentEnabled, selectedNode, sendToStella])

  function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    sendToStella(text, text)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const chips = focusModeActive && selectedNode
    ? getFocusChips(selectedNode, activeLens)
    : selectedNode
      ? getNodeChips(selectedNode)
      : NO_NODE_CHIPS
  const headerJourneyLabel = journeyStatus === 'active'
    ? 'Journey live'
    : journeyStatus === 'paused'
      ? 'Resume journey'
      : journeyStatus === 'complete'
        ? 'Restart journey'
        : 'Start journey'
  const onHeaderJourneyAction = journeyStatus === 'paused'
    ? onResumeJourney
    : journeyStatus === 'complete'
      ? onRestartJourney
      : onStartJourney

  return (
    <aside
      className={`guide-panel ${floating ? 'guide-panel--floating' : ''} ${isInteracting ? 'is-interacting' : ''}`}
      style={floatingStyle}
    >
      <div
        className={`guide-header ${floating ? 'guide-header--draggable' : ''}`}
        onPointerDown={floating ? onDragStart : undefined}
      >
        <div className="guide-header-copy">
          <div className="guide-eyebrow">AI Guide</div>
          <div className="guide-identity">
            <div className="guide-avatar">✦</div>
            <div>
              <div className="guide-name">Stella</div>
              <div className="guide-status">your guide</div>
            </div>
          </div>
        </div>
        <div className="guide-header-status">
          {onHeaderJourneyAction && (
            <button
              type="button"
              className="guide-story-button"
              onClick={onHeaderJourneyAction}
              disabled={journeyStatus === 'active'}
            >
              {headerJourneyLabel}
            </button>
          )}
          <div className="guide-orb" aria-hidden="true" />
        </div>
      </div>

      <div className="guide-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`guide-message guide-message--${msg.role}`}>
            {msg.role === 'stella' && (
              <span className="guide-message-label">Stella</span>
            )}
            <p className="guide-message-text">{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="guide-message guide-message--stella">
            <span className="guide-message-label">Stella</span>
            <div className="guide-message-text guide-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="guide-footer">
        {selectedNode && <MiniNodeCard node={selectedNode} />}

        <div className="guide-chips" aria-label="Suggested prompts">
          {chips.map(chip => (
            <button
              key={chip.label}
              className="guide-chip"
              onClick={() => sendToStella(chip.prompt, chip.label)}
              disabled={loading}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="guide-input-row">
          <input
            className="guide-input"
            placeholder="Ask Stella anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="guide-send"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
      {floating && (
        <button
          type="button"
          className="floating-resize-handle"
          aria-label="Resize Stella panel"
          onPointerDown={onResizeStart}
        />
      )}
    </aside>
  )
}

function MiniNodeCard({ node }) {
  const color = COLORS[node.type]
  return (
    <div className="guide-nodecard" style={{ borderColor: color + '33' }}>
      <div className="guide-nodecard-header">
        <span className="guide-nodecard-name">{node.name}</span>
        <span
          className="guide-nodecard-badge"
          style={{ color, background: color + '18' }}
        >
          {node.type === 'mission' ? 'MISSION' : 'EXOPLANET'}
        </span>
      </div>
      <div className="guide-nodecard-stats">
        {node.type === 'exoplanet' ? (
          <>
            {node.discoveryYear && <StatPill label="Discovered" value={node.discoveryYear} />}
            {node.distance && <StatPill label="Distance" value={`${node.distance} ly`} />}
            {node.temperature && <StatPill label="Temp" value={`${node.temperature} K`} />}
          </>
        ) : (
          <>
            {node.launchYear && <StatPill label="Launched" value={node.launchYear} />}
            {node.status && <StatPill label="Status" value={node.status} />}
            {node.discoveryCount && (
              <StatPill label="Discoveries" value={node.discoveryCount.toLocaleString()} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StatPill({ label, value }) {
  return (
    <div className="guide-stat">
      <span className="guide-stat-label">{label}</span>
      <span className="guide-stat-value">{value}</span>
    </div>
  )
}
