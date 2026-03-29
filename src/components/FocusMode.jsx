import { useMemo } from 'react'
import { getFocusNodeSubtitle } from '../utils/focus-lenses'
import { getFocusLensLayouts } from '../utils/focus-lens-layout'
import KnowledgePanel from './KnowledgePanel'
import VoicePanel from './VoicePanel'

const COLORS = {
  exoplanet: '#5ec4f7',
  mission: '#f76e5e',
}

function getRenderPanelStyle(renderRect) {
  if (!renderRect) return undefined

  return {
    left: `${renderRect.x}px`,
    top: `${renderRect.y}px`,
    width: `${renderRect.width}px`,
    height: `${renderRect.height}px`,
  }
}

function getHeroStyle(phase, origin, renderRect) {
  const localOrigin = renderRect && origin
    ? {
        x: origin.x - renderRect.x,
        y: origin.y - renderRect.y,
      }
    : {
        x: 0,
        y: 0,
      }

  const base = {
    left: `${localOrigin.x}px`,
    top: `${localOrigin.y}px`,
    opacity: 0.92,
    transform: 'translate(-50%, -50%) scale(1)',
  }

  if (phase === 'focus') {
    return {
      left: '50%',
      top: '50%',
      opacity: 1,
      transform: 'translate(-50%, -50%) scale(1.08)',
    }
  }

  if (phase === 'exitingFocus') {
    return base
  }

  return base
}

export default function FocusMode({
  node,
  neighbors,
  lenses,
  phase,
  origin,
  renderRect,
  onBack,
  onAskStella,
  selectedLensId,
  onLensSelect,
  panelStyle,
  onPanelDragStart,
  onPanelResizeStart,
  panelInteracting = false,
  voicePanelStyle,
  onVoicePanelDragStart,
  onVoicePanelResizeStart,
  voicePanelInteracting = false,
}) {
  const color = COLORS[node.type]
  const subtitle = useMemo(() => getFocusNodeSubtitle(node), [node])
  const selectedLens = lenses.find(lens => lens.id === selectedLensId) ?? null
  const lensLayouts = useMemo(
    () => getFocusLensLayouts(lenses, renderRect),
    [lenses, renderRect]
  )

  return (
    <div className={`focus-mode focus-mode--${phase}`}>
      <div className="focus-mode__veil" />
      <button className="focus-back" onClick={onBack}>
        Back to Map
      </button>

      <div className="focus-render-panel" style={getRenderPanelStyle(renderRect)}>
        <div className="focus-render-panel__stage">
          <div className="focus-hero" style={getHeroStyle(phase, origin, renderRect)}>
            <div
              className="focus-hero__glow"
              style={{ '--focus-color': color }}
            />
            <div className="focus-hero__core" style={{ '--focus-color': color }}>
              <span className="focus-hero__badge">
                {node.type === 'mission' ? 'MISSION' : 'EXOPLANET'}
              </span>
              <h2 className="focus-hero__name">{node.name}</h2>
              {subtitle && <p className="focus-hero__subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="focus-ring">
            {lenses.map((lens, index) => {
              const lensLayout = lensLayouts[index]

              return (
                <button
                  key={lens.id}
                  className={`focus-lens ${selectedLensId === lens.id ? 'is-active' : ''}`}
                  style={{
                    left: lensLayout ? `${lensLayout.x}px` : '50%',
                    top: lensLayout ? `${lensLayout.y}px` : '50%',
                    '--focus-color': color,
                    '--float-delay': `${index * 0.5}s`,
                  }}
                  onClick={() => onLensSelect(lens.id)}
                >
                  <span className="focus-lens__icon">{lens.icon}</span>
                  <span className="focus-lens__title">{lens.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <KnowledgePanel
        node={node}
        lens={selectedLens}
        onAskStella={onAskStella}
        onBack={() => onLensSelect(null)}
        floating={true}
        floatingStyle={panelStyle}
        onDragStart={onPanelDragStart}
        onResizeStart={onPanelResizeStart}
        isInteracting={panelInteracting}
      />
      <VoicePanel
        key={`${node.id}:${selectedLens?.id ?? 'overview'}`}
        node={node}
        lens={selectedLens}
        neighbors={neighbors}
        floating={true}
        floatingStyle={voicePanelStyle}
        onDragStart={onVoicePanelDragStart}
        onResizeStart={onVoicePanelResizeStart}
        isInteracting={voicePanelInteracting}
      />
    </div>
  )
}
