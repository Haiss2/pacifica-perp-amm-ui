import { useEffect, useRef, useState } from 'react'

const POLL_MS = 5000

export function usePolledResource(fetchFn, { refreshToken = 0, onUpdate, deps = [] } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fetchRef = useRef(fetchFn)
  const onUpdateRef = useRef(onUpdate)
  fetchRef.current = fetchFn
  onUpdateRef.current = onUpdate

  useEffect(() => {
    let cancelled = false

    function load() {
      return fetchRef
        .current()
        .then((result) => {
          if (cancelled) return
          setData(result)
          setError(null)
          onUpdateRef.current?.(new Date())
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    load()
    const interval = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken, ...deps])

  return { data, loading, error }
}
