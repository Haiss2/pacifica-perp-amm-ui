import { Fragment, useMemo, useState } from 'react'
import { MARKOUT_WINDOWS, summarizePnlByTrades } from '../lib/pnl'
import { TIME_RANGES } from '../lib/timeRanges'

const MARKOUT_GROUPS = [
  { key: 'markout_pnl', label: 'Markout' },
  { key: 'markout_pnl_1s', label: 'Markout 1s' },
  { key: 'markout_pnl_2s', label: 'Markout 2s' },
  { key: 'markout_pnl_5s', label: 'Markout 5s' },
]

function formatUsd(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

function formatBps(pnl, volume) {
  const p = Number(pnl)
  const v = Number(volume)
  if (!(v > 0) || Number.isNaN(p)) return '-'
  const bps = (p / v) * 10000
  return bps.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function pnlClass(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return n >= 0 ? 'positive' : 'negative'
}

export default function PnlSummary({ title, trades, loading, error, timeRange, onTimeRangeChange }) {
  const [reduceFilter, setReduceFilter] = useState('')

  const filteredTrades = useMemo(
    () =>
      reduceFilter
        ? trades.filter((trade) => (trade.Reduce ? 'Yes' : 'No') === reduceFilter)
        : trades,
    [trades, reduceFilter],
  )
  const data = useMemo(() => summarizePnlByTrades(filteredTrades), [filteredTrades])

  if (loading) return <p className="status">Loading PNL summary…</p>
  if (error) return <p className="status error">Error: {error}</p>
  if (data.length === 0) return <p className="status">No PNL data.</p>

  const rows = [...data].sort((a, b) => a.symbol.localeCompare(b.symbol))

  const totals = rows.reduce(
    (acc, row) => ({
      volume: acc.volume + Number(row.volume),
      position_pnl: acc.position_pnl + Number(row.position_pnl),
      ...Object.fromEntries(
        MARKOUT_WINDOWS.map(({ key }) => [key, acc[key] + Number(row[key])]),
      ),
    }),
    { volume: 0, position_pnl: 0, ...Object.fromEntries(MARKOUT_WINDOWS.map(({ key }) => [key, 0])) },
  )

  return (
    <>
      <div className="section-header">
        <div className="section-header-left">
          <h2 className="tab-section-title">{title}</h2>
          <div className="section-actions">
            {TIME_RANGES.map((range) => (
              <label key={range.id} className="checkbox-field">
                <input
                  type="checkbox"
                  checked={timeRange === range.id}
                  onChange={() => onTimeRangeChange(range.id)}
                />
                {range.label}
              </label>
            ))}
          </div>
        </div>
        <label className="select-filter">
          <span>Reduce</span>
          <select value={reduceFilter} onChange={(e) => setReduceFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </label>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-center">Symbol</th>
              <th rowSpan={2} className="col-center">Volume</th>
              <th className="group-header group-start" colSpan={2}>Position</th>
              {MARKOUT_GROUPS.map((group) => (
                <th key={group.key} className="group-header group-start" colSpan={2}>
                  {group.label}
                </th>
              ))}
            </tr>
            <tr>
              <th className="group-start col-center">PnL</th>
              <th className="col-center">Bps</th>
              {MARKOUT_GROUPS.map((group) => (
                <Fragment key={group.key}>
                  <th className="group-start col-center">PnL</th>
                  <th className="col-center">Bps</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol}>
                <td className="symbol col-center">
                  <span className="symbol-inner">
                    <img
                      src={`https://app.pacifica.fi/imgs/tokens/${row.symbol}.svg`}
                      alt=""
                      className="symbol-logo"
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                    {row.symbol}
                  </span>
                </td>
                <td className="col-center">{formatUsd(row.volume)}</td>
                <td className={`group-start col-center ${pnlClass(row.position_pnl)}`}>
                  {formatUsd(row.position_pnl)}
                </td>
                <td className="col-center">{formatBps(row.position_pnl, row.volume)}</td>
                {MARKOUT_GROUPS.map((group) => (
                  <Fragment key={group.key}>
                    <td className={`group-start col-center ${pnlClass(row[group.key])}`}>
                      {formatUsd(row[group.key])}
                    </td>
                    <td className="col-center">{formatBps(row[group.key], row.volume)}</td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td className="col-center">Total</td>
              <td className="col-center">{formatUsd(totals.volume)}</td>
              <td className={`group-start col-center ${pnlClass(totals.position_pnl)}`}>
                {formatUsd(totals.position_pnl)}
              </td>
              <td className="col-center">{formatBps(totals.position_pnl, totals.volume)}</td>
              {MARKOUT_GROUPS.map((group) => (
                <Fragment key={group.key}>
                  <td className={`group-start col-center ${pnlClass(totals[group.key])}`}>
                    {formatUsd(totals[group.key])}
                  </td>
                  <td className="col-center">{formatBps(totals[group.key], totals.volume)}</td>
                </Fragment>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}
