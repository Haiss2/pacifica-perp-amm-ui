import { useCallback, useState } from 'react'

const EXPAND_DEPTH = 2

function isCollapsible(value) {
  return value !== null && typeof value === 'object' && Object.keys(value).length > 0
}

function summarize(value) {
  const count = Array.isArray(value) ? value.length : Object.keys(value).length
  const noun = Array.isArray(value) ? 'item' : 'key'
  return Array.isArray(value) ? `[${count} ${noun}${count === 1 ? '' : 's'}]` : `{${count} ${noun}${count === 1 ? '' : 's'}}`
}

function formatScalar(value) {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  return String(value)
}

function YamlNode({ label, value, depth, path, overrides, mode, onToggle }) {
  const collapsible = isCollapsible(value)
  const defaultExpanded = mode === 'all' ? true : depth < EXPAND_DEPTH
  const expanded = overrides[path] ?? defaultExpanded

  if (!collapsible) {
    return (
      <div className="yaml-line" style={{ paddingLeft: depth * 16 }}>
        {label !== null && <span className="yaml-key">{label}: </span>}
        <span className="yaml-value">{formatScalar(value)}</span>
      </div>
    )
  }

  const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.entries(value)

  return (
    <div>
      <div className="yaml-line yaml-toggle" style={{ paddingLeft: depth * 16 }} onClick={() => onToggle(path, expanded)}>
        <span className="yaml-caret">{expanded ? '▾' : '▸'}</span>
        {label !== null && <span className="yaml-key">{label}:</span>}
        {!expanded && <span className="yaml-summary"> {summarize(value)}</span>}
      </div>
      {expanded &&
        entries.map(([key, val]) => (
          <YamlNode
            key={key}
            label={Array.isArray(value) ? `- ${key}` : key}
            value={val}
            depth={depth + 1}
            path={`${path}.${key}`}
            overrides={overrides}
            mode={mode}
            onToggle={onToggle}
          />
        ))}
    </div>
  )
}

export default function Configuration({ title, config, loading, error }) {
  const [overrides, setOverrides] = useState({})
  const [mode, setMode] = useState('depth')

  const handleToggle = useCallback((path, currentlyExpanded) => {
    setOverrides((prev) => ({ ...prev, [path]: !currentlyExpanded }))
  }, [])

  const handleExpand = () => {
    setMode('all')
    setOverrides({})
  }

  const handleCollapse = () => {
    setMode('depth')
    setOverrides({})
  }

  const isTree = config !== undefined && config !== null && typeof config === 'object'

  return (
    <>
      <div className="section-header">
        <h2 className="tab-section-title">{title}</h2>
        <div className="section-actions">
          <button type="button" className="action-btn" onClick={handleExpand}>
            Expand
          </button>
          <button type="button" className="action-btn" onClick={handleCollapse}>
            Collapse
          </button>
        </div>
      </div>
      {loading && <p className="status">Loading configuration…</p>}
      {error && <p className="status error">Error: {error}</p>}
      {!loading && !error && (
        <div className="json-view yaml-view">
          {isTree ? (
            Object.entries(config).map(([key, value]) => (
              <YamlNode
                key={key}
                label={key}
                value={value}
                depth={0}
                path={key}
                overrides={overrides}
                mode={mode}
                onToggle={handleToggle}
              />
            ))
          ) : (
            <div className="yaml-line">{formatScalar(config)}</div>
          )}
        </div>
      )}
    </>
  )
}
