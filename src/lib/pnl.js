export const MARKOUT_WINDOWS = [
  { key: 'markout_pnl', suffix: '' },
  { key: 'markout_pnl_1s', suffix: '_1s' },
  { key: 'markout_pnl_2s', suffix: '_2s' },
  { key: 'markout_pnl_5s', suffix: '_5s' },
]

export function calcMarkoutPnl(trade, midField) {
  const amount = Number(trade.Amount)
  const price = Number(trade.Price)
  const mid = Number(trade.ExtraData?.[midField])
  if (Number.isNaN(amount) || Number.isNaN(price) || Number.isNaN(mid)) return null
  return trade.Side === 'BUY' ? amount * (mid - price) : amount * (price - mid)
}

export function summarizePnlByTrades(trades, midField = 'binance_mid') {
  const bySymbol = new Map()

  for (const trade of trades) {
    const amount = Number(trade.Amount)
    const price = Number(trade.Price)
    const notional = Number.isNaN(amount) || Number.isNaN(price) ? 0 : amount * price
    const positionPnl = Number(trade.PnL) || 0

    const entry = bySymbol.get(trade.Symbol) ?? {
      symbol: trade.Symbol,
      volume: 0,
      position_pnl: 0,
      ...Object.fromEntries(MARKOUT_WINDOWS.map(({ key }) => [key, 0])),
    }
    entry.volume += notional
    entry.position_pnl += positionPnl
    for (const { key, suffix } of MARKOUT_WINDOWS) {
      entry[key] += calcMarkoutPnl(trade, `${midField}${suffix}`) ?? 0
    }
    bySymbol.set(trade.Symbol, entry)
  }

  return Array.from(bySymbol.values())
}
