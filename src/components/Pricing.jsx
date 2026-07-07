function formatPrice(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '-'
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })
}

function formatSpreadBps(bid, ask) {
  const b = Number(bid)
  const a = Number(ask)
  if (!(b > 0) || !(a > 0)) return '-'
  const bps = ((a - b) / b) * 10000
  return `${bps.toLocaleString(undefined, { maximumFractionDigits: 2 })} bps`
}

export default function Pricing({ pricing, loading, error }) {
  if (loading) return <p className="status">Loading pricing…</p>
  if (error) return <p className="status error">Error: {error}</p>
  if (pricing.length === 0) return <p className="status">No pricing data.</p>

  const rows = [...pricing].sort((a, b) => a.symbol.localeCompare(b.symbol))

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th rowSpan={2}>Symbol</th>
            <th className="group-header group-start" colSpan={3}>Fair</th>
            <th className="group-header group-start" colSpan={3}>Published</th>
            <th className="group-header group-start" colSpan={3}>Market</th>
          </tr>
          <tr>
            <th className="group-start">Bid</th>
            <th>Ask</th>
            <th>Spread</th>
            <th className="group-start">Bid</th>
            <th>Ask</th>
            <th>Spread</th>
            <th className="group-start">Bid</th>
            <th>Ask</th>
            <th>Spread</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.symbol}>
              <td className="symbol">
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
              <td className="group-start">{formatPrice(row.fair_price_bid)}</td>
              <td>{formatPrice(row.fair_price_ask)}</td>
              <td>{formatSpreadBps(row.fair_price_bid, row.fair_price_ask)}</td>
              <td className="group-start">{formatPrice(row.published_price_bid)}</td>
              <td>{formatPrice(row.published_price_ask)}</td>
              <td>{formatSpreadBps(row.published_price_bid, row.published_price_ask)}</td>
              <td className="group-start">{formatPrice(row.market_price_bid)}</td>
              <td>{formatPrice(row.market_price_ask)}</td>
              <td>{formatSpreadBps(row.market_price_bid, row.market_price_ask)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
