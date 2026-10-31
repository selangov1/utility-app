import { useEffect, useRef } from 'react'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/**
 * Global keyboard shortcut. `key` is matched case-insensitively; `mod` means Ctrl
 * (or Cmd on macOS).
 */
export function useHotkey(
  key: string,
  handler: (e: KeyboardEvent) => void,
  { mod = false, ignoreInInputs = false }: { mod?: boolean; ignoreInInputs?: boolean } = {},
) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== key.toLowerCase()) return
      if (mod !== (e.ctrlKey || e.metaKey)) return
      if (ignoreInInputs && isEditable(e.target)) return
      e.preventDefault()
      ref.current(e)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [key, mod, ignoreInInputs])
}
