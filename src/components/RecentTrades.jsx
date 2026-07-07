import { useState } from 'react'
import { calcMarkoutPnl } from '../lib/pnl'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const SORT_ACCESSORS = {
  time: (row) => Number(row.trade.CreatedAt),
  notional: (row) => row.notional,
  positionPnl: (row) => Number(row.trade.PnL),
  positionBps: (row) => row.positionBps,
  markoutPnl: (row) => row.markoutPnl,
  markoutBps: (row) => row.markoutBps,
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort()
}

function compareNullable(a, b) {
  const aInvalid = a == null || Number.isNaN(a)
  const bInvalid = b == null || Number.isNaN(b)
  if (aInvalid && bInvalid) return 0
  if (aInvalid) return 1
  if (bInvalid) return -1
  return a - b
}

function formatNumber(value, decimals = 4) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals })
}

function formatUsd(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

function formatTime(ms) {
  const d = new Date(Number(ms))
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function calcBps(pnl, notional) {
  const p = Number(pnl)
  const n = Number(notional)
  if (!(n > 0) || Number.isNaN(p)) return null
  return (p / n) * 10000
}

function formatBps(bps) {
  if (bps == null || Number.isNaN(bps)) return '-'
  return bps.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function pnlClass(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n >= 0 ? 'positive' : 'negative'
}

function SortableHeader({ label, column, sort, onSort }) {
  const active = sort.column === column
  return (
    <button type="button" className="sort-header" onClick={() => onSort(column)}>
      {label}
      <span className="sort-arrows">
        <span className={`sort-arrow ${active && sort.direction === 'asc' ? 'active' : ''}`}>▲</span>
        <span className={`sort-arrow ${active && sort.direction === 'desc' ? 'active' : ''}`}>▼</span>
      </span>
    </button>
  )
}

function FilterableHeader({ label, options, value, onChange }) {
  return (
    <div className="th-filter">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function RecentTrades({ title, trades, loading, error }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
  const [usePricingMid, setUsePricingMid] = useState(false)
  const [sort, setSort] = useState({ column: null, direction: null })
  const [symbolFilter, setSymbolFilter] = useState('')
  const [sideFilter, setSideFilter] = useState('')
  const [reduceFilter, setReduceFilter] = useState('')
  const midField = usePricingMid ? 'pricing_mid' : 'binance_mid'

  if (loading) return <p className="status">Loading recent trades…</p>
  if (error) return <p className="status error">Error: {error}</p>
  if (trades.length === 0) return <p className="status">No recent trades.</p>

  const symbolOptions = uniqueSorted(trades.map((trade) => trade.Symbol))
  const sideOptions = uniqueSorted(trades.map((trade) => trade.Side))
  const reduceOptions = uniqueSorted(trades.map((trade) => (trade.Reduce ? 'Yes' : 'No')))

  const filteredTrades = trades.filter((trade) => {
    if (symbolFilter && trade.Symbol !== symbolFilter) return false
    if (sideFilter && trade.Side !== sideFilter) return false
    if (reduceFilter && (trade.Reduce ? 'Yes' : 'No') !== reduceFilter) return false
    return true
  })

  const enriched = filteredTrades.map((trade) => {
    const amount = Number(trade.Amount)
    const price = Number(trade.Price)
    const notional = Number.isNaN(amount) || Number.isNaN(price) ? null : amount * price
    const markoutPnl = calcMarkoutPnl(trade, midField)
    return {
      trade,
      amount,
      price,
      notional,
      positionBps: calcBps(trade.PnL, notional),
      markoutPnl,
      markoutBps: calcBps(markoutPnl, notional),
    }
  })

  const rows = sort.column
    ? [...enriched].sort((a, b) => {
        const dir = sort.direction === 'asc' ? 1 : -1
        return dir * compareNullable(SORT_ACCESSORS[sort.column](a), SORT_ACCESSORS[sort.column](b))
      })
    : [...enriched].sort((a, b) => Number(b.trade.CreatedAt) - Number(a.trade.CreatedAt))

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function handlePageSizeChange(e) {
    setPageSize(Number(e.target.value))
    setPage(1)
  }

  function handleSort(column) {
    setSort((prev) => {
      if (prev.column !== column) return { column, direction: 'desc' }
      if (prev.direction === 'desc') return { column, direction: 'asc' }
      return { column: null, direction: null }
    })
    setPage(1)
  }

  function handleFilterChange(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <>
      <div className="section-header">
        <h2 className="tab-section-title">{title}</h2>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={usePricingMid}
            onChange={(e) => setUsePricingMid(e.target.checked)}
          />
          Use fair price for markout (Deafult: Binance USDT)
        </label>
      </div>
      <div className="table-wrap">
        <table className="data-table trades-table">
          <colgroup>
            {Array.from({ length: 12 }, (_, i) => (
              <col key={i} style={{ width: `${100 / 12}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2}>
                <FilterableHeader
                  label="Symbol"
                  options={symbolOptions}
                  value={symbolFilter}
                  onChange={handleFilterChange(setSymbolFilter)}
                />
              </th>
              <th rowSpan={2}>Trade ID</th>
              <th rowSpan={2}>
                <SortableHeader label="Time" column="time" sort={sort} onSort={handleSort} />
              </th>
              <th rowSpan={2}>
                <FilterableHeader
                  label="Side"
                  options={sideOptions}
                  value={sideFilter}
                  onChange={handleFilterChange(setSideFilter)}
                />
              </th>
              <th rowSpan={2}>Amount</th>
              <th rowSpan={2}>Price</th>
              <th rowSpan={2}>
                <SortableHeader label="Notional" column="notional" sort={sort} onSort={handleSort} />
              </th>
              <th rowSpan={2}>
                <FilterableHeader
                  label="Reduce"
                  options={reduceOptions}
                  value={reduceFilter}
                  onChange={handleFilterChange(setReduceFilter)}
                />
              </th>
              <th className="group-header group-start" colSpan={2}>Position</th>
              <th className="group-header group-start" colSpan={2}>Markout</th>
            </tr>
            <tr>
              <th className="group-start">
                <SortableHeader label="PNL" column="positionPnl" sort={sort} onSort={handleSort} />
              </th>
              <th>
                <SortableHeader label="BPS" column="positionBps" sort={sort} onSort={handleSort} />
              </th>
              <th className="group-start">
                <SortableHeader label="PNL" column="markoutPnl" sort={sort} onSort={handleSort} />
              </th>
              <th>
                <SortableHeader label="BPS" column="markoutBps" sort={sort} onSort={handleSort} />
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={12} className="status">No trades match the selected filters.</td>
              </tr>
            )}
            {pageRows.map(({ trade, amount, price, notional, markoutPnl, positionBps, markoutBps }) => {
              const isBuy = trade.Side === 'BUY'

              return (
                <tr key={trade.TradeID}>
                  <td className="symbol">
                    <span className="symbol-inner">
                      <img
                        src={`https://app.pacifica.fi/imgs/tokens/${trade.Symbol}.svg`}
                        alt=""
                        className="symbol-logo"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                      {trade.Symbol}
                    </span>
                  </td>
                  <td>{trade.TradeID}</td>
                  <td>{formatTime(trade.CreatedAt)}</td>
                  <td>
                    <span className={`badge ${isBuy ? 'long' : 'short'}`}>{trade.Side}</span>
                  </td>
                  <td>{formatNumber(amount)}</td>
                  <td>{formatUsd(price)}</td>
                  <td>{notional == null ? '-' : formatUsd(notional)}</td>
                  <td>{trade.Reduce ? 'Yes' : 'No'}</td>
                  <td className={`group-start ${pnlClass(trade.PnL)}`}>{formatUsd(trade.PnL)}</td>
                  <td>{formatBps(positionBps)}</td>
                  <td className={`group-start ${markoutPnl == null ? '' : pnlClass(markoutPnl)}`}>
                    {markoutPnl == null ? '-' : formatUsd(markoutPnl)}
                  </td>
                  <td>{formatBps(markoutBps)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <label className="pagination-size">
          Rows per page:
          <select value={pageSize} onChange={handlePageSizeChange}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="action-btn"
          disabled={currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
        >
          Prev
        </button>
        <span className="pagination-info">
          Page {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className="action-btn"
          disabled={currentPage >= totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </>
  )
}
