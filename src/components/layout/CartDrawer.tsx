import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore, type CartItem } from '../../store'
import { Badge } from '../ui/Badge'
import { QuantityStepper } from '../ui/QuantityStepper'
import { cn } from '../ui/utils'

export type CartDrawerProps = {
  onClose?: () => void
  open?: boolean
}

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path
        d="m5 5 10 10M15 5 5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M7.2 4.8V3.9c0-.9.7-1.6 1.6-1.6h2.4c.9 0 1.6.7 1.6 1.6v.9m-8.1 0h10.6M6 4.8l.7 11.1c.1 1 .8 1.7 1.8 1.7h3c1 0 1.7-.7 1.8-1.7L14 4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function EmptyCartIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="mx-auto h-28 w-28 text-gold"
      fill="none"
      viewBox="0 0 120 120"
    >
      <path
        d="M60 18 88 49 60 96 32 49 60 18Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeOpacity="0.8"
        strokeWidth="2.5"
      />
      <path
        d="M32 49h56M60 18 49 49l11 47 11-47-11-31Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeOpacity="0.12" />
    </svg>
  )
}

function CartDrawerRow({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem
  onRemove: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
}) {
  return (
    <motion.li
      animate={{ height: 'auto', opacity: 1, x: 0 }}
      className="overflow-hidden"
      exit={{ height: 0, opacity: 0, x: '-100%' }}
      initial={{ height: 0, opacity: 0, x: 24 }}
      layout
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid grid-cols-[64px_1fr] gap-4 border-b border-gold/15 py-4">
        <div className="h-16 w-16 overflow-hidden rounded-lg bg-cream-dark">
          <img alt={item.name} className="h-full w-full object-cover" src={item.image} />
        </div>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-body text-sm font-medium text-ink">
                {item.name}
              </h3>
              <Badge className="mt-2 px-2 py-0.5 text-[9px]" variant="intention">
                {item.intention ?? 'Ritual'}
              </Badge>
            </div>
            <button
              aria-label={`Eliminar ${item.name}`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-gold/10 hover:text-ink"
              onClick={() => onRemove(item.id)}
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <QuantityStepper
              className="origin-left scale-[0.82]"
              min={1}
              onChange={(quantity) => onUpdateQuantity(item.id, quantity)}
              value={item.quantity}
            />
            <p className="font-body text-sm font-semibold text-gold">
              {currencyFormatter.format(item.price * item.quantity)}
            </p>
          </div>
        </div>
      </div>
    </motion.li>
  )
}

/**
 * Store-driven right-side cart drawer with animated backdrop, collapsible rows,
 * sticky subtotal footer and empty-cart guidance.
 */
export function CartDrawer({ onClose, open }: CartDrawerProps = {}) {
  const storeOpen = useCartStore((state) => state.isOpen)
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.totals.subtotal)
  const itemCount = useCartStore((state) => state.totals.itemCount)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const toggleDrawer = useCartStore((state) => state.toggleDrawer)
  const isOpen = open ?? storeOpen

  const closeDrawer = () => {
    toggleDrawer(false)
    onClose?.()
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          aria-label="Carrito de compras"
          aria-modal="true"
          className="fixed inset-0 z-modal"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="dialog"
        >
          <button
            aria-label="Cerrar carrito desde el fondo"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={closeDrawer}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            className={cn(
              'absolute right-0 top-0 flex h-full w-full flex-col border-l border-gold/20 bg-cream-light shadow-lifted sm:w-[420px]',
            )}
            exit={{ x: '100%' }}
            initial={{ x: '100%' }}
            transition={{ damping: 35, stiffness: 300, type: 'spring' }}
          >
            <header className="flex items-center justify-between border-b border-gold/20 px-5 py-5">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-[20px] leading-none text-ink">
                  Tu pedido
                </h2>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gold px-2 font-body text-[11px] font-semibold text-ink">
                  {itemCount}
                </span>
              </div>
              <button
                aria-label="Cerrar carrito"
                className="grid h-10 w-10 place-items-center rounded-full border border-gold/30 text-gold transition-colors hover:bg-gold/10"
                onClick={closeDrawer}
                type="button"
              >
                <CloseIcon />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-36">
              {items.length ? (
                <motion.ul layout>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartDrawerRow
                        item={item}
                        key={item.id}
                        onRemove={removeItem}
                        onUpdateQuantity={updateQuantity}
                      />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              ) : (
                <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                  <EmptyCartIllustration />
                  <h3 className="mt-6 font-display text-2xl text-ink">
                    Tu carrito está vacío
                  </h3>
                  <p className="mt-3 max-w-xs font-body text-sm font-light leading-relaxed text-ink-muted">
                    Elige una pieza para empezar a construir tu pedido ritual.
                  </p>
                  <Link
                    className="auralith-shimmer relative mt-7 inline-flex h-11 items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink shadow-gold transition-colors hover:bg-gold-light"
                    onClick={closeDrawer}
                    to="/tienda"
                  >
                    <span className="relative z-10">Explorar tienda</span>
                  </Link>
                </div>
              )}
            </div>

            <footer className="absolute inset-x-0 bottom-0 border-t border-gold/20 bg-cream/95 px-5 py-5 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-body text-sm text-ink-muted">Subtotal</span>
                <span className="font-body text-lg font-semibold text-gold">
                  {currencyFormatter.format(subtotal)}
                </span>
              </div>
              <p className="mb-4 font-body text-xs text-sage-dark">
                Pago por coordinar con Auralith
              </p>
              <Link
                aria-disabled={!items.length}
                className={cn(
                  'auralith-shimmer relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-6 font-body text-sm font-semibold text-ink shadow-gold transition-colors hover:bg-gold-light',
                  !items.length && 'pointer-events-none opacity-50',
                )}
                onClick={closeDrawer}
                to="/carrito"
              >
                <span className="relative z-10">Ver pedido completo</span>
              </Link>
            </footer>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
