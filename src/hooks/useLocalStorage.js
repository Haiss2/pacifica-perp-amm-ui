import { useState } from 'react'

export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  function setStoredValue(newValue) {
    setValue((prev) => {
      const resolved = typeof newValue === 'function' ? newValue(prev) : newValue
      try {
        localStorage.setItem(key, JSON.stringify(resolved))
      } catch {
        // ignore write failures (e.g. storage disabled)
      }
      return resolved
    })
  }

  return [value, setStoredValue]
}
