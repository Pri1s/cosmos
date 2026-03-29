import { useState, useRef, useEffect } from 'react'

export default function SearchBar({ onSearch, onSelect, searchMatches, nodes }) {
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
    </div>
  )
}
