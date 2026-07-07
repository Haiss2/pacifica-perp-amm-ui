import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import Positions from './components/Positions'
import Pricing from './components/Pricing'
import PnlSummary from './components/PnlSummary'
import RecentTrades from './components/RecentTrades'
import Configuration from './components/Configuration'
import { usePolledResource } from './hooks/usePolledResource'
import { fetchPositionsData, fetchPricing, fetchTrades, fetchConfig } from './api'
import { TABS } from './tabs'
import { TIME_RANGES, DEFAULT_TIME_RANGE } from './lib/timeRanges'
import './App.css'

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const [refreshToken, setRefreshToken] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE)
  const selectedRange = TIME_RANGES.find((r) => r.id === timeRange) ?? TIME_RANGES[0]
  const contentRef = useRef(null)
  const sectionRefs = useRef({})
  const visibleRatios = useRef({})

  function handleUpdate(timestamp) {
    setLastUpdated((prev) => (!prev || timestamp > prev ? timestamp : prev))
  }

  const positionsResource = usePolledResource(fetchPositionsData, {
    refreshToken,
    onUpdate: handleUpdate,
  })
  const pricingResource = usePolledResource(fetchPricing, {
    refreshToken,
    onUpdate: handleUpdate,
  })
  const tradesResource = usePolledResource(
    () => fetchTrades(Date.now() - selectedRange.ms),
    {
      refreshToken,
      onUpdate: handleUpdate,
      deps: [timeRange],
    },
  )
  const configResource = usePolledResource(fetchConfig, {
    refreshToken,
    onUpdate: handleUpdate,
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleRatios.current[entry.target.id] = entry.intersectionRatio
        })
        const [mostVisibleId] =
          Object.entries(visibleRatios.current).sort((a, b) => b[1] - a[1])[0] ?? []
        if (mostVisibleId) setActiveTab(mostVisibleId)
      },
      { root: contentRef.current, threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  function handleSelectTab(id) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function refreshAll() {
    setRefreshToken((t) => t + 1)
  }

  return (
    <div className={`app ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar activeTab={activeTab} onSelectTab={handleSelectTab} />
      <div className="main">
        <div className="topbar">
          <button
            type="button"
            className="toggle-btn"
            aria-label={collapsed ? 'Show menu' : 'Hide menu'}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? '☰' : '✕'}
          </button>
          <button
            type="button"
            className="toggle-btn refresh-btn"
            aria-label="Refresh"
            onClick={refreshAll}
          >
            <svg className="icon" width="16" height="16" role="presentation" aria-hidden="true">
              <use href="/icons.svg#refresh-icon"></use>
            </svg>
          </button>
          <span className="last-updated">
            Last updated at: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}
          </span>
        </div>
        <div className="content" ref={contentRef}>
          {TABS.map((tab) => (
            <section
              key={tab.id}
              id={tab.id}
              role="tabpanel"
              ref={(el) => {
                sectionRefs.current[tab.id] = el
              }}
              className="tab-section"
            >
              {tab.id !== 'configuration' &&
                tab.id !== 'positions' &&
                tab.id !== 'recent-trades' &&
                tab.id !== 'pnl-summary' && <h2 className="tab-section-title">{tab.label}</h2>}
              {tab.id === 'positions' && (
                <Positions
                  positions={positionsResource.data?.positions ?? []}
                  prices={positionsResource.data?.prices ?? {}}
                  account={positionsResource.data?.account}
                  loading={positionsResource.loading}
                  error={positionsResource.error}
                />
              )}
              {tab.id === 'pricing' && (
                <Pricing
                  pricing={pricingResource.data ?? []}
                  loading={pricingResource.loading}
                  error={pricingResource.error}
                />
              )}
              {tab.id === 'pnl-summary' && (
                <PnlSummary
                  title={tab.label}
                  trades={tradesResource.data ?? []}
                  loading={tradesResource.loading}
                  error={tradesResource.error}
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                />
              )}
              {tab.id === 'recent-trades' && (
                <RecentTrades
                  title={`${tab.label} (${selectedRange.label})`}
                  trades={tradesResource.data ?? []}
                  loading={tradesResource.loading}
                  error={tradesResource.error}
                />
              )}
              {tab.id === 'configuration' && (
                <Configuration
                  title={tab.label}
                  config={configResource.data}
                  loading={configResource.loading}
                  error={configResource.error}
                />
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
