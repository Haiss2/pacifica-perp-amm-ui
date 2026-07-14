export const MODES = [
  { id: 'maker', label: 'Quote (Maker)' },
  { id: 'taker', label: 'Hunt (Taker)' },
]

export const DEFAULT_MODE = MODES[0].id

export const MODE_STORAGE_KEY = 'perp-amm-mode'

export const MODE_QUERY_PARAM = 'strat'

export function getModeFromQuery(search = window.location.search) {
  const value = new URLSearchParams(search).get(MODE_QUERY_PARAM)
  return MODES.some((m) => m.id === value) ? value : null
}
