export const ACCOUNT = import.meta.env.VITE_ACCOUNT_ADDRESS

const BASE_URL = 'https://api.pacifica.fi/api/v1'

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Request failed')
  return json.data
}

export function fetchPositions(account = ACCOUNT) {
  return getJson(`${BASE_URL}/positions?account=${account}`)
}

export function fetchPrices() {
  return getJson(`${BASE_URL}/info/prices`)
}

export function fetchAccount(account = ACCOUNT) {
  return getJson(`${BASE_URL}/account?account=${account}`)
}

export async function fetchPositionsData() {
  const [positions, pricesList, account] = await Promise.all([
    fetchPositions(),
    fetchPrices(),
    fetchAccount(),
  ])
  const prices = Object.fromEntries(pricesList.map((p) => [p.symbol, p]))
  return { positions, prices, account }
}

export function fetchConfig() {
  return getJson('/api/config')
}

export function fetchPricing() {
  return getJson('/api/pricing')
}

export function fetchTrades() {
  return getJson('/api/trades')
}
