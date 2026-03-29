import { useState } from 'react'

const COLORS = {
  exoplanet: '#5ec4f7',
  mission: '#f76e5e',
}

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`kp-section ${open ? 'is-open' : ''}`}>
      <button className="kp-section__toggle" onClick={() => setOpen(prev => !prev)}>
        <span className="kp-section__label">{title}</span>
        <span className="kp-section__chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="kp-section__body">{children}</div>}
    </div>
  )
}

export default function KnowledgePanel({
  node,
  lens,
  onAskStella,
  onBack,
  floating = false,
  floatingStyle,
  onDragStart,
  onResizeStart,
  isInteracting = false,
}) {

  if (!lens) {
    return (
      <div className={`kp kp--empty ${floating ? 'kp--floating' : ''} ${isInteracting ? 'is-interacting' : ''}`} style={floatingStyle}>
        <div
          className={`kp__header ${floating ? 'kp__header--draggable' : ''}`}
          onPointerDown={floating ? onDragStart : undefined}
        >
          <span className="kp__eyebrow">Lens Explorer</span>
          <h3 className="kp__title">Select a lens</h3>
        </div>
        <p className="kp__prompt-text">
          Choose an orbiting lens to explore {node.name} from a specific angle.
        </p>
        {floating && (
          <button
            type="button"
            className="floating-resize-handle"
            aria-label="Resize lens panel"
            onPointerDown={onResizeStart}
          />
        )}
      </div>
    )
  }

  const color = COLORS[node.type]

  return (
    <div
      className={`kp ${floating ? 'kp--floating' : ''} ${isInteracting ? 'is-interacting' : ''}`}
      style={{ '--kp-color': color, ...floatingStyle }}
    >
      <div
        className={`kp__header ${floating ? 'kp__header--draggable' : ''}`}
        onPointerDown={floating ? onDragStart : undefined}
      >
        <div className="kp__header-top">
          <span className="kp__eyebrow">Lens Explorer</span>
          <button
            className="kp__close"
            onClick={onBack}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>
        <div className="kp__title-row">
          <span className="kp__icon">{lens.icon}</span>
          <h3 className="kp__title">{lens.title}</h3>
          <span className="kp__node-tag">{node.name}</span>
        </div>
      </div>

      <div className="kp__scroll">
        <Section title="Overview" defaultOpen={true}>
          <p className="kp__narrative">{lens.summary}</p>
        </Section>

        {lens.whyItMatters && (
          <Section title="Why It Matters" defaultOpen={true}>
            <div className="kp__callout">
              <p>{lens.whyItMatters}</p>
            </div>
          </Section>
        )}

        {lens.facts && lens.facts.length > 0 && (
          <Section title="Key Facts" defaultOpen={true}>
            <div className="kp__facts">
              {lens.facts.map((fact, i) => (
                <div key={i} className="kp__fact">
                  <span className="kp__fact-label">{fact.label}</span>
                  <span className="kp__fact-value">{fact.value}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {lens.context && (
          <Section title="Context" defaultOpen={true}>
            <p className="kp__context">{lens.context}</p>
          </Section>
        )}

        {lens.questions && lens.questions.length > 0 && (
          <Section title="Open Questions" defaultOpen={false}>
            <ul className="kp__questions">
              {lens.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <div className="kp__footer">
        <button className="kp__action" onClick={() => onAskStella(lens)}>
          Ask Stella
        </button>
      </div>
      {floating && (
        <button
          type="button"
          className="floating-resize-handle"
          aria-label="Resize lens panel"
          onPointerDown={onResizeStart}
        />
      )}
    </div>
  )
}
