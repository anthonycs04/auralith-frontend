import { AnimatePresence, motion } from 'framer-motion'
import { cn } from './utils'

export type QuantityStepperProps = {
  className?: string
  disabled?: boolean
  max?: number
  min?: number
  onChange: (value: number) => void
  step?: number
  value: number
}

/**
 * Quantity control with disabled bounds and a vertical flip animation
 * whenever the displayed number changes.
 */
export function QuantityStepper({
  className,
  disabled = false,
  max = Number.POSITIVE_INFINITY,
  min = 1,
  onChange,
  step = 1,
  value,
}: QuantityStepperProps) {
  const canDecrement = !disabled && value > min
  const canIncrement = !disabled && value < max

  return (
    <div
      className={cn(
        'inline-grid h-10 grid-cols-[2.5rem_3rem_2.5rem] overflow-hidden rounded-full border border-gold/30 bg-cream-light text-ink',
        className,
      )}
    >
      <button
        aria-label="Disminuir cantidad"
        className="grid place-items-center text-lg text-gold transition-colors hover:bg-gold/10 disabled:pointer-events-none disabled:text-ink-muted/40"
        disabled={!canDecrement}
        onClick={() => onChange(Math.max(min, value - step))}
        type="button"
      >
        −
      </button>
      <div className="grid place-items-center overflow-hidden border-x border-gold/20 font-body text-sm font-medium">
        <AnimatePresence mode="wait">
          <motion.span
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, rotateX: 80, y: -14 }}
            initial={{ opacity: 0, rotateX: -80, y: 14 }}
            key={value}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <button
        aria-label="Aumentar cantidad"
        className="grid place-items-center text-lg text-gold transition-colors hover:bg-gold/10 disabled:pointer-events-none disabled:text-ink-muted/40"
        disabled={!canIncrement}
        onClick={() => onChange(Math.min(max, value + step))}
        type="button"
      >
        +
      </button>
    </div>
  )
}
