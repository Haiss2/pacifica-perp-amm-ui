import { DEFAULT_MODE, MODE_STORAGE_KEY } from './modes'

const ENDPOINTS_BY_MODE = {
  maker: {
    account: import.meta.env.VITE_ACCOUNT_ADDRESS,
    endpoint: import.meta.env.VITE_PERP_AMM_ENDPOINT,
  },
  taker: {
    account: import.meta.env.VITE_BLIND_TAKER_ACCOUNT_ADDRESS,
    endpoint: import.meta.env.VITE_BLIND_TAKER_ENDPOINT,
  },
}

function getStoredMode() {
  try {
    return JSON.parse(localStorage.getItem(MODE_STORAGE_KEY)) ?? DEFAULT_MODE
  } catch {
    return DEFAULT_MODE
  }
}

const BASE_URL = 'https://api.pacifica.fi/api/v1'

export let ACCOUNT
let PERP_AMM_URL

export function setApiMode(mode) {
  const config = ENDPOINTS_BY_MODE[mode] ?? ENDPOINTS_BY_MODE[DEFAULT_MODE]
  ACCOUNT = config.account
  PERP_AMM_URL = config.endpoint.replace(/\/$/, '')
}

setApiMode(getStoredMode())

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
  return getJson(`${PERP_AMM_URL}/config`)
}

export function fetchPricing() {
  return getJson(`${PERP_AMM_URL}/pricing`)
}

export function fetchTrades(startTime) {
  const query = startTime ? `?start_time=${startTime}` : ''
  return getJson(`${PERP_AMM_URL}/trades${query}`)
}
