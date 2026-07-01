import { useCallback, useRef, type PointerEvent } from 'react'

export type MagneticEffectOptions = {
  maxRotate?: number
  maxOffset?: number
  mode?: 'tilt' | 'translate'
  resetTransition?: string
  strength?: number
}

export function useMagneticEffect<T extends HTMLElement>({
  maxRotate = 6,
  maxOffset = 18,
  mode = 'translate',
  resetTransition = 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
  strength = 0.28,
}: MagneticEffectOptions = {}) {
  const ref = useRef<T>(null)

  const onPointerMove = useCallback(
    (event: PointerEvent<T>) => {
      const element = ref.current

      if (!element) {
        return
      }

      const rect = element.getBoundingClientRect()

      element.style.transition = 'transform 80ms linear'

      if (mode === 'tilt') {
        const normalizedX = (event.clientX - rect.left - rect.width / 2) /
          (rect.width / 2)
        const normalizedY = (event.clientY - rect.top - rect.height / 2) /
          (rect.height / 2)
        const rotateY = Math.max(
          Math.min(normalizedX * maxRotate, maxRotate),
          -maxRotate,
        )
        const rotateX = Math.max(
          Math.min(-normalizedY * maxRotate, maxRotate),
          -maxRotate,
        )

        element.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
        return
      }

      const x = (event.clientX - rect.left - rect.width / 2) * strength
      const y = (event.clientY - rect.top - rect.height / 2) * strength
      const clampedX = Math.max(Math.min(x, maxOffset), -maxOffset)
      const clampedY = Math.max(Math.min(y, maxOffset), -maxOffset)

      element.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`
    },
    [maxOffset, maxRotate, mode, strength],
  )

  const onPointerLeave = useCallback(() => {
    const element = ref.current

    if (!element) {
      return
    }

    element.style.transition = resetTransition
    element.style.transform =
      mode === 'tilt' ? 'rotateX(0deg) rotateY(0deg)' : 'translate3d(0, 0, 0)'
  }, [mode, resetTransition])

  return {
    magneticProps: {
      onPointerLeave,
      onPointerMove,
    },
    ref,
  }
}
