const COLORS = { exoplanet: '#5ec4f7', mission: '#f76e5e' }

export default function JourneyPanel({
  journey,
  currentNode,
  recommendations,
  onStartJourney,
  onContinueJourney,
  onContinueToNode,
  onPauseJourney,
  onResumeJourney,
  onRestartJourney,
  onMarkJourneyVisited,
  onDiveDeeper,
  onSetJourneyCurrentFromNode,
  candidateNode,
  onClose,
  floating = false,
  floatingStyle,
  onDragStart,
  onResizeStart,
  isInteracting = false,
}) {
  if (!journey) return null

  const primaryRecommendation = recommendations[0] ?? null
  const visitedLabel = `${journey.visitedCount} / ${journey.totalCount}`
  const missionName = journey.activeMission?.name ?? 'Guided Journey'
  const currentVisited = journey.currentVisited

  return (
    <aside
      className={`journey-panel ${floating ? 'journey-panel--floating' : ''} ${isInteracting ? 'is-interacting' : ''}`}
      style={floatingStyle}
    >
      <div
        className={`journey-panel__header ${floating ? 'journey-panel__header--draggable' : ''}`}
        onPointerDown={floating ? onDragStart : undefined}
      >
        <div>
          <div className="journey-panel__eyebrow">Guided Journey</div>
          <h3 className="journey-panel__title">{missionName}</h3>
        </div>
        <div className="journey-panel__header-right">
          <div className="journey-panel__progress">
            <span className="journey-panel__progress-value">{visitedLabel}</span>
            <span className="journey-panel__progress-label">visited</span>
          </div>
          {onClose && (
            <button className="journey-panel__close" onClick={onClose} aria-label="Close journey panel">×</button>
          )}
        </div>
      </div>

      <div className="journey-panel__body">
        {journey.status === 'complete' ? (
          <div className="guide-journey__summary">
            <p>{journey.completionSummary}</p>
            <div className="guide-journey__controls">
              <button type="button" className="guide-journey__primary" onClick={onRestartJourney}>
                Restart journey
              </button>
            </div>
          </div>
        ) : (
          <>
            {currentNode ? (
              <>
                <div className="guide-journey__current">
                  <div className="guide-journey__current-top">
                    <span className="guide-journey__current-label">Current stop</span>
                    {currentVisited && <span className="guide-journey__visited-badge">Visited</span>}
                  </div>
                  <MiniNodeCard node={currentNode} />
                  <p className="guide-journey__summary-text">{journey.currentSummary}</p>
                </div>

                {candidateNode && onSetJourneyCurrentFromNode && (
                  <div className="guide-journey__candidate">
                    <div>
                      <div className="guide-journey__candidate-label">Manual exploration</div>
                      <div className="guide-journey__candidate-name">{candidateNode.name}</div>
                    </div>
                    <button
                      type="button"
                      className="guide-journey__candidate-action"
                      onClick={() => onSetJourneyCurrentFromNode(candidateNode.id)}
                    >
                      Set as current stop
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="guide-journey__summary">
                <p>Start the guided journey to move mission by mission through the full 200-node catalog.</p>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="guide-journey__recommendations">
                <div className="guide-journey__list-label">Next recommendations</div>
                <div className="guide-journey__list">
                  {recommendations.map((recommendation) => (
                    <button
                      key={recommendation.node.id}
                      type="button"
                      className={`guide-journey__recommendation ${recommendation.rank === 1 ? 'is-primary' : ''}`}
                      onClick={() => onContinueToNode?.(recommendation.node.id)}
                      disabled={journey.status !== 'active'}
                    >
                      <div className="guide-journey__recommendation-top">
                        <span className="guide-journey__recommendation-rank">#{recommendation.rank}</span>
                        <span className="guide-journey__recommendation-name">{recommendation.node.name}</span>
                      </div>
                      <div className="guide-journey__recommendation-reason">{recommendation.reason}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="guide-journey__controls">
              {journey.status === 'idle' && onStartJourney && (
                <button type="button" className="guide-journey__primary" onClick={onStartJourney}>
                  Start journey
                </button>
              )}
              {journey.status === 'paused' && onResumeJourney && (
                <button type="button" className="guide-journey__primary" onClick={onResumeJourney}>
                  Resume journey
                </button>
              )}
              {journey.status === 'active' && primaryRecommendation && onContinueJourney && (
                <button
                  type="button"
                  className="guide-journey__primary"
                  onClick={() => onContinueJourney(primaryRecommendation.node.id)}
                >
                  Continue to {primaryRecommendation.node.name}
                </button>
              )}
              {journey.status === 'active' && onMarkJourneyVisited && (
                <button
                  type="button"
                  className="guide-journey__secondary"
                  onClick={onMarkJourneyVisited}
                  disabled={currentVisited}
                >
                  Mark visited
                </button>
              )}
              {journey.status === 'active' && onPauseJourney && (
                <button type="button" className="guide-journey__secondary" onClick={onPauseJourney}>
                  Pause
                </button>
              )}
              {currentNode && onDiveDeeper && (
                <button type="button" className="guide-journey__secondary" onClick={onDiveDeeper}>
                  Dive deeper
                </button>
              )}
              {journey.status !== 'complete' && onRestartJourney && (
                <button type="button" className="guide-journey__secondary" onClick={onRestartJourney}>
                  Restart
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {floating && (
        <button
          type="button"
          className="floating-resize-handle"
          aria-label="Resize guided journey panel"
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
