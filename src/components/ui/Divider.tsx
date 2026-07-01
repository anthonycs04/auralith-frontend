import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from './utils'

export type DividerProps = {
  className?: string
}

/**
 * Decorative centered divider whose lines grow outward on scroll.
 */
export function Divider({ className }: DividerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.6, once: true })

  return (
    <div
      aria-hidden="true"
      className={cn('flex items-center gap-4 py-8 text-gold', className)}
      ref={ref}
    >
      <motion.span
        animate={{ scaleX: inView ? 1 : 0 }}
        className="h-px flex-1 origin-right bg-gold/40"
        initial={{ scaleX: 0 }}
        transition={{ duration: 0.64, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0.72 }}
        className="font-display text-lg leading-none"
        initial={{ opacity: 0, scale: 0.72 }}
        transition={{ delay: 0.16, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        ✦
      </motion.span>
      <motion.span
        animate={{ scaleX: inView ? 1 : 0 }}
        className="h-px flex-1 origin-left bg-gold/40"
        initial={{ scaleX: 0 }}
        transition={{ duration: 0.64, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
