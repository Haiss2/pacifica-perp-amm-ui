import { ACCOUNT } from '../api'

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

function formatPercent(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return `${(n * 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}%`
}

export default function Positions({ positions, prices, account, loading, error }) {
  if (loading) return <p className="status">Loading positions…</p>
  if (error) return <p className="status error">Error: {error}</p>

  const rows = positions
    .map((pos) => {
      const mark = Number(prices[pos.symbol]?.mark)
      const entry = Number(pos.entry_price)
      const amount = Number(pos.amount)
      const isLong = pos.side === 'bid'
      const notional = Number.isNaN(mark) ? null : mark * amount
      const upnl = Number.isNaN(mark)
        ? null
        : (mark - entry) * amount * (isLong ? 1 : -1)

      return { pos, mark, entry, amount, isLong, notional, upnl }
    })
    .sort((a, b) => (b.notional ?? -Infinity) - (a.notional ?? -Infinity))

  const rowsWithUpnl = rows.filter((r) => r.upnl != null)
  const totalUpnl = rowsWithUpnl.reduce((sum, r) => sum + r.upnl, 0)
  const equity = Number(account?.account_equity)
  const marginRatio = account && equity ? Number(account.cross_mmr) / equity : null

  return (
    <>
      <h2 className="tab-section-title">Account</h2>
      <dl className="account-summary">
        <div className="account-summary-row">
          <dt>Account</dt>
          <dd>
            <a
              href={`https://app.pacifica.fi/portfolio/${ACCOUNT}`}
              target="_blank"
              rel="noreferrer"
            >
              {ACCOUNT}
            </a>
          </dd>
        </div>
        <div className="account-summary-row">
          <dt>Account Equity</dt>
          <dd>{account ? formatUsd(account.account_equity) : '-'}</dd>
        </div>
        <div className="account-summary-row">
          <dt>Position UPNL</dt>
          <dd className={rowsWithUpnl.length === 0 ? '' : totalUpnl >= 0 ? 'positive' : 'negative'}>
            {rowsWithUpnl.length === 0 ? '-' : formatUsd(totalUpnl)}
          </dd>
        </div>
        <div className="account-summary-row">
          <dt>Margin Ratio</dt>
          <dd>{marginRatio == null ? '-' : formatPercent(marginRatio)}</dd>
        </div>
      </dl>
      <h2 className="tab-section-title positions-title">Positions</h2>
      {positions.length === 0 ? (
        <p className="status">No open positions.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th>Size</th>
                <th>Entry Price</th>
                <th>Mark Price</th>
                <th>Notional</th>
                <th>UPNL</th>
                <th>Liq. Price</th>
                <th>Funding</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ pos, mark, entry, amount, isLong, notional, upnl }) => (
                <tr key={pos.symbol}>
                  <td className="symbol">
                    <span className="symbol-inner">
                      <img
                        src={`https://app.pacifica.fi/imgs/tokens/${pos.symbol}.svg`}
                        alt=""
                        className="symbol-logo"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                      {pos.symbol}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${isLong ? 'long' : 'short'}`}>
                      {isLong ? 'Long' : 'Short'}
                    </span>
                  </td>
                  <td>{formatNumber(amount)}</td>
                  <td>{formatUsd(entry)}</td>
                  <td>{Number.isNaN(mark) ? '-' : formatUsd(mark)}</td>
                  <td>{notional == null ? '-' : formatUsd(notional)}</td>
                  <td className={upnl == null ? '' : upnl >= 0 ? 'positive' : 'negative'}>
                    {upnl == null ? '-' : formatUsd(upnl)}
                  </td>
                  <td>{formatUsd(pos.liquidation_price)}</td>
                  <td>{formatNumber(pos.funding, 6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
