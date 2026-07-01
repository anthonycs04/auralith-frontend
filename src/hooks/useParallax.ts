import {
  useScroll,
  useTransform,
  type MotionValue,
  type UseScrollOptions,
} from 'framer-motion'
import { useRef } from 'react'

export type ParallaxResult<T extends HTMLElement> = {
  ref: React.RefObject<T | null>
  scrollYProgress: MotionValue<number>
  y: MotionValue<number>
}

export function useParallax<T extends HTMLElement>(
  distance = 80,
  options?: Omit<UseScrollOptions, 'target'>,
): ParallaxResult<T> {
  const ref = useRef<T>(null)
  const { scrollYProgress } = useScroll({
    offset: ['start end', 'end start'],
    ...options,
    target: ref,
  })
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance])

  return { ref, scrollYProgress, y }
}
