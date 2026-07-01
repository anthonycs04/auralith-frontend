import { useAnimation, useInView, type UseInViewOptions } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function useScrollAnimation<T extends HTMLElement>(
  options: UseInViewOptions = { amount: 0.22, once: true },
) {
  const ref = useRef<T>(null)
  const controls = useAnimation()
  const inView = useInView(ref, options)

  useEffect(() => {
    if (inView) {
      void controls.start('visible')
    }
  }, [controls, inView])

  return { controls, inView, ref }
}
