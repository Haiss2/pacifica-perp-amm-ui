import { useEffect, useState } from 'react'
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite'
import 'react-json-view-lite/dist/index.css'

const EXPAND_DEPTH = 2
const expandToDepth = (level) => level < EXPAND_DEPTH

const lightStyle = { ...defaultStyles, container: `${defaultStyles.container} json-view-container` }
const darkStyle = { ...darkStyles, container: `${darkStyles.container} json-view-container` }

function usePrefersDark() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDark
}

export default function Configuration({ title, config, loading, error }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isDark = usePrefersDark()

  const shouldExpandNode = isExpanded ? allExpanded : expandToDepth

  return (
    <>
      <div className="section-header">
        <h2 className="tab-section-title">{title}</h2>
        <div className="section-actions">
          <button type="button" className="action-btn" onClick={() => setIsExpanded(true)}>
            Expand
          </button>
          <button type="button" className="action-btn" onClick={() => setIsExpanded(false)}>
            Collapse
          </button>
        </div>
      </div>
      {loading && <p className="status">Loading configuration…</p>}
      {error && <p className="status error">Error: {error}</p>}
      {!loading && !error && (
        <div className="json-view">
          <JsonView data={config} shouldExpandNode={shouldExpandNode} style={isDark ? darkStyle : lightStyle} />
        </div>
      )}
    </>
  )
}
