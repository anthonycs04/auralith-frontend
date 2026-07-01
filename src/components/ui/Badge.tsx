import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { scaleIn } from '../../styles/animations'
import { cn } from './utils'

export type BadgeVariant =
  | 'intention'
  | 'lowStock'
  | 'new'
  | 'offer'
  | 'soldOut'

export type BadgeProps = Omit<HTMLMotionProps<'span'>, 'children'> & {
  children?: ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  intention: 'bg-sage/15 text-sage-dark ring-sage/20',
  lowStock: 'bg-amber-100 text-amber-800 ring-amber-300/40',
  new: 'bg-gold/20 text-gold-dark ring-gold/30',
  offer: 'bg-ink text-cream-light ring-ink',
  soldOut: 'bg-beige/15 text-ink-muted ring-beige/25',
}

/**
 * Compact status pill for product states, intentions and offers.
 */
export function Badge({
  children,
  className,
  variant = 'intention',
  ...props
}: BadgeProps) {
  return (
    <motion.span
      animate="visible"
      className={cn(
        'inline-flex w-fit items-center rounded-full px-3 py-1 font-body text-[11px] font-medium uppercase leading-none tracking-widest ring-1',
        variantClasses[variant],
        className,
      )}
      data-variant={variant}
      initial="hidden"
      transition={{ duration: 0.2, stiffness: 400, type: 'spring' }}
      variants={scaleIn}
      {...props}
    >
      {children}
    </motion.span>
  )
}
