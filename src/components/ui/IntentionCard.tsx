import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMagneticEffect } from '../../hooks/useMagneticEffect'
import { cn } from './utils'

export type IntentionCardProps = {
  className?: string
  href?: string
  icon?: ReactNode
  image: string
  imageAlt?: string
  name: string
  onExplore?: () => void
  phrase: string
}

function DefaultIntentionIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-9 w-9"
      fill="none"
      viewBox="0 0 48 48"
    >
      <path
        d="M24 5c2.4 7.2 6.8 11.6 14 14-7.2 2.4-11.6 6.8-14 14-2.4-7.2-6.8-11.6-14-14 7.2-2.4 11.6-6.8 14-14Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M35 29c1.2 3.5 3.3 5.6 7 7-3.7 1.3-5.8 3.5-7 7-1.3-3.5-3.4-5.7-7-7 3.6-1.4 5.7-3.5 7-7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

const MotionLink = motion.create(Link)

/**
 * Square intention tile with subtle 3D tilt, background imagery,
 * icon spring rotation and an animated explore affordance.
 */
export function IntentionCard({
  className,
  href = '#',
  icon,
  image,
  imageAlt = '',
  name,
  onExplore,
  phrase,
}: IntentionCardProps) {
  const { magneticProps, ref } = useMagneticEffect<HTMLAnchorElement>({
    maxRotate: 6,
    mode: 'tilt',
  })

  return (
    <div className={cn('aspect-square [perspective:900px]', className)}>
      <MotionLink
        className="group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-gold/20 bg-cream p-6 text-center transition-colors duration-300 ease-auralith hover:border-gold/80 hover:bg-gold/10"
        initial="rest"
        onClick={onExplore}
        ref={ref}
        style={{ transformStyle: 'preserve-3d' }}
        to={href}
        whileHover="hover"
        {...magneticProps}
      >
        <img
          alt={imageAlt}
          aria-hidden={imageAlt ? undefined : true}
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
          loading="lazy"
          src={image}
        />
        <div className="absolute inset-0 bg-cream/10" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4">
          <motion.div
            className="text-gold [filter:drop-shadow(0_2px_4px_rgba(34,34,34,0.7))]"
            transition={{ damping: 18, stiffness: 400, type: 'spring' }}
            variants={{
              hover: { rotate: 8 },
              rest: { rotate: 0 },
            }}
          >
            {icon ?? <DefaultIntentionIcon />}
          </motion.div>
          <div className="space-y-2">
            <h3 className="font-display text-2xl leading-tight text-cream-light [text-shadow:0_2px_3px_rgba(34,34,34,0.95),0_0_14px_rgba(34,34,34,0.65)]">
              {name}
            </h3>
            <p className="font-body text-sm font-medium italic leading-relaxed text-cream-light [text-shadow:0_1px_3px_rgba(34,34,34,1),0_0_10px_rgba(34,34,34,0.8)]">
              {phrase}
            </p>
          </div>
          <span className="font-body text-sm font-semibold text-gold-light [text-shadow:0_1px_3px_rgba(34,34,34,1),0_0_8px_rgba(34,34,34,0.8)] transition-transform duration-300 ease-auralith group-hover:translate-x-1">
            Explorar →
          </span>
        </div>
      </MotionLink>
    </div>
  )
}
