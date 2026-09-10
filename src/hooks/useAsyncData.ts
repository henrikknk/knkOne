import { useEffect, useState } from 'react'
import { errorMessage } from '../lib/format'

export type AsyncData<T> = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; data: T }

/** Lädt Daten einmal beim Mounten. `load` muss referenzstabil sein (Modulfunktion oder useCallback). */
export function useAsyncData<T>(load: () => Promise<T>): AsyncData<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncData<T>>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    load().then(
      (data) => {
        if (active) setState({ status: 'ready', data })
      },
      (error: unknown) => {
        if (active) setState({ status: 'error', error: errorMessage(error, 'Daten konnten nicht geladen werden') })
      },
    )
    return () => {
      active = false
    }
  }, [load, reloadKey])

  const reload = () => {
    setState({ status: 'loading' })
    setReloadKey((key) => key + 1)
  }

  return { ...state, reload }
}
