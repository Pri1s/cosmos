import { useState, useCallback, useEffect } from 'react'
import BrainMap from './components/BrainMap'
import SearchBar from './components/SearchBar'
import DetailPanel from './components/DetailPanel'
import GuidePanel from './components/GuidePanel'
import { nodes } from './data/graph-data'

const GUIDE_PANEL_WIDTH = 380

export default function App() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [searchMatches, setSearchMatches] = useState(null)
  const [graphRef, setGraphRef] = useState(null)
  const [mapWidth, setMapWidth] = useState(window.innerWidth - GUIDE_PANEL_WIDTH)

  useEffect(() => {
    const handleResize = () => setMapWidth(window.innerWidth - GUIDE_PANEL_WIDTH)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node)
  }, [])

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchMatches(null)
      return
    }
    const q = query.toLowerCase()
    const matches = new Set(
      nodes.filter(n => n.name.toLowerCase().includes(q)).map(n => n.id)
    )
    setSearchMatches(matches.size > 0 ? matches : new Set())

    if (matches.size === 1 && graphRef) {
      const matchId = [...matches][0]
      const node = nodes.find(n => n.id === matchId)
      if (node) {
        graphRef.centerAt(node.x, node.y, 500)
        graphRef.zoom(2, 500)
      }
    }
  }, [graphRef])

  return (
    <div className="app-layout">
      <div className="map-area">
        <BrainMap
          selectedNode={selectedNode}
          hoveredNode={hoveredNode}
          searchMatches={searchMatches}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoveredNode}
          onBackgroundClick={handleBackgroundClick}
          onGraphReady={setGraphRef}
          width={mapWidth}
        />
        <SearchBar
          onSearch={handleSearch}
          onSelect={(node) => setSelectedNode(node)}
          searchMatches={searchMatches}
          nodes={nodes}
        />
        {selectedNode && (
          <DetailPanel
            node={selectedNode}
            graphRef={graphRef}
            onClose={() => setSelectedNode(null)}
            maxX={mapWidth}
          />
        )}
      </div>
      <GuidePanel selectedNode={selectedNode} />
    </div>
  )
}
