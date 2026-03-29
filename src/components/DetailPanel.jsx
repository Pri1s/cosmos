import { useState, useEffect } from 'react'

const COLORS = {
  exoplanet: '#5ec4f7',
  mission: '#f76e5e',
}

export default function DetailPanel({ node, graphRef, onClose, closing, maxX, maxY }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  function updatePosition() {
    if (!graphRef || !node) return
    const coords = graphRef.graph2ScreenCoords(node.x, node.y)
    const panelWidth = 320
    const panelHeight = 400
    let x = coords.x + 20
    let y = coords.y - 40

    // Clamp to viewport
    if (x + panelWidth > (maxX ?? window.innerWidth) - 16) {
      x = coords.x - panelWidth - 20
    }
    if (y + panelHeight > (maxY ?? window.innerHeight) - 16) {
      y = (maxY ?? window.innerHeight) - panelHeight - 16
    }
    if (y < 16) y = 16
    if (x < 16) x = 16

    setPosition({ x, y })
  }

  useEffect(() => {
    if (!graphRef || !node) return
    updatePosition()
    requestAnimationFrame(() => setVisible(true))
    return () => setVisible(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, graphRef])

  useEffect(() => {
    if (!graphRef) return
    // force-graph emits zoom events via onZoom prop, but we can also poll
    const interval = setInterval(updatePosition, 100)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphRef, node])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const show = visible && !closing
  const color = COLORS[node.type]

  return (
    <div
      className="detail-panel"
      style={{
        left: position.x,
        top: position.y,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
        pointerEvents: closing ? 'none' : undefined,
      }}
    >
      <button className="detail-close" onClick={onClose}>×</button>
      <div className="detail-header">
        <h2 className="detail-name">{node.name}</h2>
        <span className="detail-badge" style={{ background: color + '22', color }}>
          {node.type === 'mission' ? 'MISSION' : 'EXOPLANET'}
        </span>
      </div>

      <div className="detail-rows">
        {node.type === 'exoplanet' ? (
          <>
            <Row label="Host star" value={node.hostStar} />
            <Row label="Discovered" value={node.discoveryYear} />
            <Row label="Method" value={node.method} />
            <Row label="Mass" value={node.mass ? `${node.mass} M⊕` : 'Unknown'} />
            <Row label="Radius" value={node.radius ? `${node.radius} R⊕` : 'Unknown'} />
            <Row label="Orbital period" value={node.orbitalPeriod} />
            <Row label="Temperature" value={node.temperature ? `${node.temperature} K` : 'Unknown'} />
            <Row label="Distance" value={node.distance ? `${node.distance} ly` : 'Unknown'} />
            {node.habitability && (
              <p className="detail-note">{node.habitability}</p>
            )}
          </>
        ) : (
          <>
            <Row label="Agency" value={node.agency} />
            <Row label="Launched" value={node.launchYear} />
            <Row label="Status" value={node.status} />
            <Row label="Method" value={node.method} />
            <Row label="Discoveries" value={node.discoveryCount?.toLocaleString()} />
            {node.contribution && (
              <p className="detail-note">{node.contribution}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}
