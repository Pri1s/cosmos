import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ onSearch, onSelect, searchMatches, nodes, onJourneyOpen, journeyActive }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef()

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.key === '/' || (e.metaKey && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('')
        onSearch('')
        inputRef.current.blur()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onSearch])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    onSearch(val)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && searchMatches?.size === 1) {
      const matchId = [...searchMatches][0]
      const node = nodes.find(n => n.id === matchId)
      if (node) onSelect(node)
    }
  }

  function handleClear() {
    setQuery('')
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <div className="search-container">
      <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        className="search-input"
        type="text"
        placeholder="Search planets and missions..."
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {query && (
        <button className="search-clear" onClick={handleClear}>×</button>
      )}
      <kbd className="search-hint">/</kbd>
      {onJourneyOpen && (
        <>
          <div className="search-divider" />
          <button
            className={`search-journey-btn ${journeyActive ? 'search-journey-btn--active' : ''}`}
            onClick={onJourneyOpen}
            title="Guided Journey"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
              <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
            </svg>
            Guided Journey
          </button>
        </>
      )}
    </div>
  )
}
