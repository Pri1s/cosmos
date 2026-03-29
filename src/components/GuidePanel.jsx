import { useState, useEffect, useRef, useCallback } from 'react'
import { sendMessage } from '../api/stella'

const WELCOME =
  "Welcome to Cosmos — a living atlas of worlds beyond our solar system. I'm Stella, your guide. Click any node on the map to learn about it, or ask me anything. Where would you like to start?"

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

const COLORS = { exoplanet: '#5ec4f7', mission: '#f76e5e' }

export default function GuidePanel({ selectedNode }) {
  const [messages, setMessages] = useState([
    { id: 0, role: 'stella', text: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const conversationRef = useRef([])
  const prevNodeIdRef = useRef(null)

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
      const reply = await sendMessage(conversationRef.current)
      conversationRef.current = [...conversationRef.current, { role: 'assistant', content: reply }]
      setMessages(prev => [...prev, { id: Date.now(), role: 'stella', text: reply }])
    } catch (err) {
      const text = err.message?.includes('VITE_ANTHROPIC_API_KEY')
        ? 'No API key found. Add VITE_ANTHROPIC_API_KEY to your .env file to enable my responses.'
        : 'Sorry, I had trouble connecting. Please try again in a moment.'
      setMessages(prev => [...prev, { id: Date.now(), role: 'stella', text }])
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-comment when user selects a node
  useEffect(() => {
    if (!selectedNode) {
      prevNodeIdRef.current = null
      return
    }
    if (selectedNode.id === prevNodeIdRef.current) return
    prevNodeIdRef.current = selectedNode.id

    const prompt =
      selectedNode.type === 'mission'
        ? `The user just selected the mission "${selectedNode.name}" on the map. Here is its data: ${JSON.stringify(selectedNode)}. Give a brief, engaging 2–4 sentence comment about this mission and what it contributed to exoplanet science.`
        : `The user just selected the exoplanet "${selectedNode.name}" on the map. Here is its data: ${JSON.stringify(selectedNode)}. Give a brief, engaging 2–4 sentence comment about this world — what makes it interesting, notable, or worth exploring.`

    sendToStella(prompt)
  }, [selectedNode, sendToStella])

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

  const chips = selectedNode ? getNodeChips(selectedNode) : NO_NODE_CHIPS

  return (
    <aside className="guide-panel">
      {/* Header */}
      <div className="guide-header">
        <div className="guide-avatar">✦</div>
        <div className="guide-identity">
          <div className="guide-name">Stella</div>
          <div className="guide-status">your guide</div>
        </div>
      </div>

      {/* Chat messages */}
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

      {/* Mini node card */}
      {selectedNode && <MiniNodeCard node={selectedNode} />}

      {/* Quick action chips */}
      <div className="guide-chips">
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

      {/* Text input */}
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
          ↑
        </button>
      </div>
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
