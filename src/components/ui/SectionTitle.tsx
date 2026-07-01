import { motion, useInView } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { fadeIn, fadeUp } from '../../styles/animations'
import { cn } from './utils'

export type SectionTitleProps = {
  align?: 'center' | 'left'
  className?: string
  eyebrow?: string
  subtitle?: string
  title: string | string[]
}

const alignClasses = {
  center: 'mx-auto items-center text-center',
  left: 'items-start text-left',
} as const

/**
 * Scroll-triggered section heading with staggered eyebrow, line reveal title
 * and delayed supporting copy.
 */
export function SectionTitle({
  align = 'center',
  className,
  eyebrow,
  subtitle,
  title,
}: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.35, once: true })
  const titleLines = useMemo(
    () => (Array.isArray(title) ? title : title.split('\n')),
    [title],
  )

  return (
    <div
      className={cn(
        'flex max-w-prose flex-col gap-4',
        alignClasses[align],
        className,
      )}
      ref={ref}
    >
      {eyebrow ? (
        <motion.p
          animate={inView ? 'visible' : 'hidden'}
          className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark"
          initial="hidden"
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          variants={fadeIn}
        >
          {eyebrow}
        </motion.p>
      ) : null}
      <h2 className="font-display text-4xl leading-tight text-ink md:text-5xl">
        {titleLines.map((line, index) => (
          <span className="block overflow-hidden" key={`${line}-${index}`}>
            <motion.span
              animate={inView ? { y: 0 } : { y: '110%' }}
              className="block"
              initial={{ y: '110%' }}
              transition={{
                delay: 0.12 + index * 0.08,
                duration: 0.62,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </h2>
      {subtitle ? (
        <motion.p
          animate={inView ? 'visible' : 'hidden'}
          className="font-body text-base font-light leading-relaxed text-ink-muted"
          initial="hidden"
          transition={{ delay: 0.28, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
          variants={fadeUp}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </div>
  )
}
