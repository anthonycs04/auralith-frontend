import { motion, type HTMLMotionProps } from 'framer-motion'
import {
  useCallback,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cn } from './utils'

export type ButtonVariant = 'ghost' | 'primary' | 'whatsapp'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children?: ReactNode
  icon?: ReactNode
  loading?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

type Ripple = {
  id: number
  size: number
  x: number
  y: number
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
}

const variantClasses: Record<ButtonVariant, string> = {
  ghost:
    'border border-gold/70 bg-transparent text-ink hover:border-sage hover:bg-sage/10',
  primary: 'border border-gold bg-gold text-ink shadow-gold hover:bg-gold-light',
  whatsapp: 'border border-[#25D366] bg-[#25D366] text-ink hover:brightness-105',
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 32 32"
    >
      <path d="M16.02 4C9.4 4 4.02 9.28 4.02 15.78c0 2.08.56 4.11 1.62 5.9L4 28l6.49-1.66a12.2 12.2 0 0 0 5.53 1.34C22.6 27.68 28 22.4 28 15.9 28 9.39 22.6 4 16.02 4Zm0 21.66c-1.78 0-3.52-.47-5.04-1.37l-.36-.21-3.86.99 1.03-3.67-.24-.38a9.69 9.69 0 0 1-1.5-5.24c0-5.39 4.47-9.77 9.97-9.77 5.5 0 9.97 4.44 9.97 9.89 0 5.37-4.47 9.76-9.97 9.76Zm5.46-7.3c-.3-.15-1.77-.86-2.04-.95-.27-.1-.47-.15-.67.14-.2.3-.77.95-.94 1.14-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.46-.89-.78-1.49-1.74-1.66-2.03-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.58-.92-2.16-.24-.56-.49-.48-.67-.49h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1-1.04 2.42 0 1.43 1.07 2.8 1.22 3 .15.2 2.1 3.13 5.1 4.38.71.3 1.27.48 1.7.62.72.22 1.37.19 1.89.12.58-.08 1.77-.72 2.02-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.34Z" />
    </svg>
  )
}

function Spinner() {
  return (
    <motion.span
      aria-hidden="true"
      animate={{ rotate: 360 }}
      className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
      transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
    />
  )
}

/**
 * Branded Auralith button with shimmer hover, spring press, optional icon,
 * loading state and click-origin ripple feedback.
 */
export function Button({
  children,
  className,
  disabled,
  icon,
  loading = false,
  onClick,
  onPointerDown,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])

  const createRipple = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(event)

      if (disabled || loading) {
        return
      }

      const rect = event.currentTarget.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 1.8
      const ripple = {
        id: Date.now(),
        size,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
      }

      setRipples((current) => [...current, ripple])
      window.setTimeout(() => {
        setRipples((current) => current.filter((item) => item.id !== ripple.id))
      }, 520)
    },
    [disabled, loading, onPointerDown],
  )

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (loading) {
        event.preventDefault()
        return
      }

      onClick?.(event)
    },
    [loading, onClick],
  )

  const renderedIcon = variant === 'whatsapp' ? (icon ?? <WhatsAppIcon />) : icon

  return (
    <motion.button
      className={cn(
        'auralith-shimmer relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-body font-medium transition-colors duration-300 ease-auralith focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-60',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      data-size={size}
      data-variant={variant}
      disabled={disabled || loading}
      onClick={handleClick}
      onPointerDown={createRipple}
      transition={{ damping: 24, stiffness: 400, type: 'spring' }}
      type={type}
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {ripples.map((ripple) => (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-cream-light/45"
          initial={{ opacity: 0.45, scale: 0 }}
          key={ripple.id}
          style={{
            height: ripple.size,
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
          }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          animate={{ opacity: 0, scale: 1 }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center gap-2">
        {loading ? <Spinner /> : renderedIcon}
      {children}
      </span>
    </motion.button>
  )
}
