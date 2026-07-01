import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { cn } from '../components/ui/utils'
import { products } from '../data'
import { apiFetch } from '../lib/api'
import { createWhatsAppUrl } from '../lib/contact'
import {
  shippingMethods,
  useCartStore,
  useCatalogStore,
  type CartItem,
  type ShippingMethod,
} from '../store'

type DeliveryType = ShippingMethod

type CheckoutForm = {
  address: string
  city: string
  deliveryType: DeliveryType
  fullName: string
  note: string
  phonePrefix: string
  whatsapp: string
}

type CheckoutErrors = Partial<Record<keyof CheckoutForm, string>>

type SavedOrder = {
  createdAt: string
  customer: CheckoutForm
  id: string
  items: CartItem[]
  subtotal: number
}

const NOTE_LIMIT = 220

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

const deliveryOptions: Array<{
  description: string
  label: string
  value: DeliveryType
}> = shippingMethods.map((method) => ({
  description:
    method === 'Recojo en tienda'
      ? 'Separa tu pedido y recógelo directamente en Auralith.'
      : `Despacho coordinado por ${method}.`,
  label: method,
  value: method,
}))

const initialForm: CheckoutForm = {
  address: '',
  city: '',
  deliveryType: 'Recojo en tienda',
  fullName: '',
  note: '',
  phonePrefix: '+51',
  whatsapp: '',
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 32 32">
      <path d="M16.02 4C9.4 4 4.02 9.28 4.02 15.78c0 2.08.56 4.11 1.62 5.9L4 28l6.49-1.66a12.2 12.2 0 0 0 5.53 1.34C22.6 27.68 28 22.4 28 15.9 28 9.39 22.6 4 16.02 4Zm0 21.66c-1.78 0-3.52-.47-5.04-1.37l-.36-.21-3.86.99 1.03-3.67-.24-.38a9.69 9.69 0 0 1-1.5-5.24c0-5.39 4.47-9.77 9.97-9.77 5.5 0 9.97 4.44 9.97 9.89 0 5.37-4.47 9.76-9.97 9.76Zm5.46-7.3c-.3-.15-1.77-.86-2.04-.95-.27-.1-.47-.15-.67.14-.2.3-.77.95-.94 1.14-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.46-.89-.78-1.49-1.74-1.66-2.03-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.58-.92-2.16-.24-.56-.49-.48-.67-.49h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1-1.04 2.42 0 1.43 1.07 2.8 1.22 3 .15.2 2.1 3.13 5.1 4.38.71.3 1.27.48 1.7.62.72.22 1.37.19 1.89.12.58-.08 1.77-.72 2.02-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.34Z" />
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

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      aria-hidden="true"
      className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
      transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
    />
  )
}

function EmptyCartIllustration() {
  return (
    <svg
      aria-hidden="true"
      className="mx-auto h-32 w-32 text-gold"
      fill="none"
      viewBox="0 0 120 120"
    >
      <path
        d="M60 18 88 49 60 96 32 49 60 18Z"
        stroke="currentColor"
        strokeLinejoin="round"
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

function ErrorMessage({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.p
          animate={{ opacity: 1, x: [0, -4, 4, -4, 0], y: 0 }}
          className="mt-2 font-body text-xs text-red-600"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.26 }}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  )
}

function FloatingField({
  error,
  id,
  label,
  maxLength,
  onChange,
  rows = 4,
  type = 'text',
  value,
}: {
  error?: string
  id: keyof CheckoutForm
  label: string
  maxLength?: number
  onChange: (value: string) => void
  rows?: number
  type?: string
  value: string
}) {
  const [focused, setFocused] = useState(false)
  const floated = focused || value.length > 0
  const controlClassName =
    'peer w-full rounded-xl border bg-cream-light px-4 pb-3 pt-6 font-body text-sm text-ink outline-none transition-colors placeholder:text-transparent focus:border-gold'
  const borderClassName = error ? 'border-red-400' : 'border-cream-dark'

  return (
    <div>
      <div className="relative">
        {id === 'note' ? (
          <textarea
            className={cn(controlClassName, borderClassName, 'min-h-[120px] resize-none')}
            id={id}
            maxLength={maxLength}
            onBlur={() => setFocused(false)}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            rows={rows}
            value={value}
          />
        ) : (
          <input
            className={cn(controlClassName, borderClassName)}
            id={id}
            onBlur={() => setFocused(false)}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setFocused(true)}
            type={type}
            value={value}
          />
        )}
        <label
          className={cn(
            'pointer-events-none absolute left-4 font-body text-sm text-ink-muted transition-all duration-200',
            floated
              ? 'top-2 text-[10px] uppercase tracking-widest text-gold-dark'
              : 'top-1/2 -translate-y-1/2',
            id === 'note' && !floated && 'top-6 translate-y-0',
          )}
          htmlFor={id}
        >
          {label}
        </label>
      </div>
      {maxLength ? (
        <p className="mt-1 text-right font-body text-[11px] text-ink-muted">
          {value.length}/{maxLength}
        </p>
      ) : null}
      <ErrorMessage message={error} />
    </div>
  )
}

function PhoneField({
  error,
  form,
  onPhoneChange,
  onPrefixChange,
}: {
  error?: string
  form: CheckoutForm
  onPhoneChange: (value: string) => void
  onPrefixChange: (value: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const floated = focused || form.whatsapp.length > 0

  return (
    <div>
      <div className="relative">
        <select
          aria-label="Prefijo telefónico"
          className="absolute left-3 top-1/2 z-10 h-9 -translate-y-1/2 rounded-full border border-gold/20 bg-cream px-2 font-body text-xs text-ink outline-none"
          onChange={(event) => onPrefixChange(event.target.value)}
          value={form.phonePrefix}
        >
          <option value="+51">+51</option>
          <option value="+1">+1</option>
          <option value="+34">+34</option>
        </select>
        <input
          className={cn(
            'w-full rounded-xl border bg-cream-light pb-3 pl-24 pr-4 pt-6 font-body text-sm text-ink outline-none transition-colors focus:border-gold',
            error ? 'border-red-400' : 'border-cream-dark',
          )}
          id="whatsapp"
          inputMode="tel"
          onBlur={() => setFocused(false)}
          onChange={(event) => onPhoneChange(event.target.value)}
          onFocus={() => setFocused(true)}
          value={form.whatsapp}
        />
        <label
          className={cn(
            'pointer-events-none absolute left-24 font-body text-sm text-ink-muted transition-all duration-200',
            floated
              ? 'top-2 text-[10px] uppercase tracking-widest text-gold-dark'
              : 'top-1/2 -translate-y-1/2',
          )}
          htmlFor="whatsapp"
        >
          Número de WhatsApp
        </label>
      </div>
      <ErrorMessage message={error} />
    </div>
  )
}

function CartSummaryRow({
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
      exit={{ height: 0, opacity: 0, x: -80 }}
      initial={{ height: 0, opacity: 0, x: 24 }}
      layout
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="grid gap-5 border-b border-gold/15 py-6 sm:grid-cols-[96px_1fr_auto]">
        <div className="h-24 w-24 overflow-hidden rounded-xl bg-cream-dark">
          <img alt={item.name} className="h-full w-full object-cover" src={item.image} />
        </div>
        <div className="min-w-0">
          <Badge className="px-2.5 py-1 text-[10px]" variant="intention">
            {item.intention ?? 'Ritual'}
          </Badge>
          <h2 className="mt-3 font-display text-2xl leading-tight text-ink">
            {item.name}
          </h2>
          <p className="mt-1 font-body text-sm text-ink-muted">
            {item.sku ?? 'Pieza Auralith'}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <QuantityStepper
              min={1}
              onChange={(quantity) => onUpdateQuantity(item.id, quantity)}
              value={item.quantity}
            />
            <button
              aria-label={`Eliminar ${item.name}`}
              className="grid h-10 w-10 place-items-center rounded-full text-ink-muted transition-colors hover:bg-gold/10 hover:text-ink"
              onClick={() => onRemove(item.id)}
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
        <p className="self-start font-body text-lg font-semibold text-gold sm:text-right">
          {currencyFormatter.format(item.price * item.quantity)}
        </p>
      </div>
    </motion.li>
  )
}

function CompactOrderSummary({
  items,
  subtotal,
}: {
  items: CartItem[]
  subtotal: number
}) {
  return (
    <div className="mt-7 border-t border-gold/20 pt-5">
      <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold-dark">
        Resumen de pedido
      </p>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div className="flex items-start justify-between gap-3" key={item.id}>
            <p className="font-body text-xs leading-relaxed text-ink-muted">
              {item.quantity} x {item.name}
            </p>
            <p className="shrink-0 font-body text-xs font-semibold text-ink">
              {currencyFormatter.format(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-gold/15 pt-4">
        <span className="font-body text-sm text-ink-muted">Total aproximado</span>
        <span className="font-body text-xl font-semibold text-gold">
          {currencyFormatter.format(subtotal)}
        </span>
      </div>
      <p className="mt-4 rounded-xl bg-sage/10 px-4 py-3 font-body text-xs leading-relaxed text-sage-dark">
        El pago, disponibilidad final y entrega se coordinan directamente con
        Auralith por WhatsApp.
      </p>
    </div>
  )
}

function validateForm(form: CheckoutForm, hasItems: boolean): CheckoutErrors {
  const errors: CheckoutErrors = {}

  if (!hasItems) {
    errors.note = 'Agrega al menos un producto antes de enviar tu pedido.'
  }

  if (!form.fullName.trim()) {
    errors.fullName = 'Ingresa tu nombre completo.'
  }

  if (!form.whatsapp.trim()) {
    errors.whatsapp = 'Ingresa tu número de WhatsApp.'
  } else if (form.whatsapp.replace(/\D/g, '').length < 7) {
    errors.whatsapp = 'Revisa el numero de WhatsApp.'
  }

  if (!form.city.trim()) {
    errors.city = 'Ingresa tu ciudad.'
  }

  if (form.deliveryType !== 'Recojo en tienda' && !form.address.trim()) {
    errors.address = 'Indica la dirección o agencia de destino.'
  }

  return errors
}

function getDeliveryLabel(deliveryType: DeliveryType) {
  return deliveryType
}

function buildWhatsAppMessage({
  form,
  items,
  subtotal,
}: {
  form: CheckoutForm
  items: CartItem[]
  subtotal: number
}) {
  const productLines = items
    .map(
      (item, index) =>
        `${index + 1}. ${item.name} x${item.quantity} - ${currencyFormatter.format(
          item.price * item.quantity,
        )}`,
    )
    .join('\n')

  return [
    '✨ *Nuevo pedido Auralith*',
    '',
    '*Productos:*',
    productLines,
    '',
    `*Total aproximado:* ${currencyFormatter.format(subtotal)}`,
    '',
    '*Datos del cliente:*',
    `Nombre: ${form.fullName.trim()}`,
    `WhatsApp: ${form.phonePrefix} ${form.whatsapp.trim()}`,
    `Ciudad: ${form.city.trim()}`,
    `Método de envío: ${getDeliveryLabel(form.deliveryType)}`,
    `Dirección o agencia: ${
      form.deliveryType !== 'Recojo en tienda'
        ? form.address.trim()
        : 'Recojo en tienda'
    }`,
    `Nota: ${form.note.trim() || 'Sin nota'}`,
  ].join('\n')
}

function saveOrder(order: SavedOrder) {
  const rawOrders = window.localStorage.getItem('auralith-orders')
  let orders: SavedOrder[]

  try {
    orders = rawOrders ? (JSON.parse(rawOrders) as SavedOrder[]) : []
  } catch {
    orders = []
  }

  const nextOrders = [order, ...orders].slice(0, 20)

  window.localStorage.setItem('auralith-last-order', JSON.stringify(order))
  window.localStorage.setItem('auralith-orders', JSON.stringify(nextOrders))
}

function ConfirmationOverlay({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[120] grid place-items-center bg-cream/95 px-5 text-center backdrop-blur-xl"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ damping: 22, stiffness: 260, type: 'spring' }}
          >
            <p className="font-display text-3xl tracking-widest text-ink">AURALITH</p>
            <svg
              aria-hidden="true"
              className="mx-auto mt-8 h-24 w-24 text-[#25D366]"
              fill="none"
              viewBox="0 0 96 96"
            >
              <motion.circle
                cx="48"
                cy="48"
                pathLength="1"
                r="38"
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeWidth="5"
              />
              <motion.path
                animate={{ pathLength: 1 }}
                d="M29 49.5 42 62l26-30"
                initial={{ pathLength: 0 }}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="6"
                transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <h2 className="mt-7 font-display text-4xl text-ink">¡Pedido enviado!</h2>
            <p className="mx-auto mt-4 max-w-sm font-body text-sm font-light leading-relaxed text-ink-muted">
              Te redirigiremos a WhatsApp para coordinar pago y entrega.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function CartPage() {
  useCatalogStore((state) => state.version)
  const siteContent = useCatalogStore((state) => state.content)
  const items = useCartStore((state) => state.items)
  const subtotal = useCartStore((state) => state.totals.subtotal)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const toggleDrawer = useCartStore((state) => state.toggleDrawer)
  const [form, setForm] = useState<CheckoutForm>(initialForm)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [isSending, setIsSending] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  )

  const setField = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateForm(form, items.length > 0)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const unavailableItem = items.find((item) => {
      const product = products.find((current) => current.id === item.id)
      return (
        !product ||
        product.status === 'sold-out' ||
        product.stock <= 0 ||
        item.quantity > product.stock
      )
    })

    if (unavailableItem) {
      const product = products.find((current) => current.id === unavailableItem.id)
      setErrors({
        note: product
          ? `${product.name} no tiene stock suficiente. Disponible: ${product.stock}.`
          : `${unavailableItem.name} ya no esta disponible.`,
      })
      return
    }

    setIsSending(true)

    let createdOrder: { code: string; createdAt: string }

    try {
      createdOrder = await apiFetch<{ code: string; createdAt: string }>('/orders', {
        body: JSON.stringify({
          address:
            form.deliveryType === 'Recojo en tienda'
              ? undefined
              : form.address.trim(),
          city: form.city.trim(),
          customerName: form.fullName.trim(),
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          note: form.note.trim() || undefined,
          shippingMethod: form.deliveryType,
          whatsapp: `${form.phonePrefix}${form.whatsapp}`.replace(/\D/g, ''),
        }),
        method: 'POST',
      })
    } catch (error) {
      setIsSending(false)
      setErrors({
        note:
          (error instanceof Error ? error.message : null) ??
          'Uno de los productos ya no tiene stock suficiente.',
      })
      return
    }

    const order: SavedOrder = {
      createdAt: createdOrder.createdAt,
      customer: form,
      id: createdOrder.code,
      items,
      subtotal,
    }
    const message = buildWhatsAppMessage({ form, items, subtotal })
    const whatsappUrl = createWhatsAppUrl(siteContent?.whatsappNumber, message)

    window.setTimeout(() => {
      saveOrder(order)
      setIsSending(false)
      setConfirmationOpen(true)

      window.setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      }, 2000)
    }, 520)
  }

  return (
    <main className="min-h-screen bg-cream px-5 pb-20 pt-32 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-3 border-b border-gold/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
              Carrito
            </p>
            <h1 className="mt-3 font-display text-5xl leading-tight text-ink">
              Tu pedido Auralith
            </h1>
          </div>
          <p className="font-body text-sm text-ink-muted">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'} en el pedido
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,60fr)_minmax(360px,40fr)]">
          <section>
            {items.length ? (
              <>
                <motion.ul layout>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <CartSummaryRow
                        item={item}
                        key={item.id}
                        onRemove={removeItem}
                        onUpdateQuantity={updateQuantity}
                      />
                    ))}
                  </AnimatePresence>
                </motion.ul>
                <div className="mt-8 flex items-center justify-between border-t border-gold/20 pt-6">
                  <span className="font-body text-sm uppercase tracking-widest text-ink-muted">
                    Subtotal
                  </span>
                  <span className="font-body text-2xl font-semibold text-gold">
                    {currencyFormatter.format(subtotal)}
                  </span>
                </div>
              </>
            ) : (
              <div className="grid min-h-[46vh] place-items-center rounded-2xl border border-gold/20 bg-cream-light px-6 py-12 text-center">
                <div>
                  <EmptyCartIllustration />
                  <h2 className="mt-7 font-display text-3xl text-ink">
                    Tu carrito está vacío
                  </h2>
                  <p className="mx-auto mt-3 max-w-md font-body text-sm font-light leading-relaxed text-ink-muted">
                    Explora la tienda y agrega las piezas que quieres coordinar
                    con Auralith.
                  </p>
                  <Link
                    className="auralith-shimmer relative mt-7 inline-flex h-12 items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-6 font-body text-sm font-semibold text-ink shadow-gold transition-colors hover:bg-gold-light"
                    onClick={() => toggleDrawer(false)}
                    to="/tienda"
                  >
                    <span className="relative z-10">Explorar tienda</span>
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <form
              className="rounded-2xl border border-gold/20 bg-cream-light p-5 shadow-soft md:p-6"
              onSubmit={handleSubmit}
            >
              <h2 className="font-display text-3xl leading-tight text-ink">
                Completa tu pedido
              </h2>
              <div className="mt-6 space-y-4">
                <FloatingField
                  error={errors.fullName}
                  id="fullName"
                  label="Nombre completo"
                  onChange={(value) => setField('fullName', value)}
                  value={form.fullName}
                />
                <PhoneField
                  error={errors.whatsapp}
                  form={form}
                  onPhoneChange={(value) => setField('whatsapp', value)}
                  onPrefixChange={(value) => setField('phonePrefix', value)}
                />
                <FloatingField
                  error={errors.city}
                  id="city"
                  label="Ciudad"
                  onChange={(value) => setField('city', value)}
                  value={form.city}
                />

                <fieldset>
                  <legend className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-gold-dark">
                    Método de envío
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {deliveryOptions.map((option) => {
                      const isActive = form.deliveryType === option.value

                      return (
                        <button
                          aria-checked={isActive}
                          className={cn(
                            'relative rounded-xl border p-4 text-left transition-colors',
                            isActive
                              ? 'border-gold bg-cream-dark'
                              : 'border-cream-dark bg-cream-light hover:border-gold/50',
                          )}
                          key={option.value}
                          onClick={() => {
                            setForm((current) => ({
                              ...current,
                              deliveryType: option.value,
                            }))
                            setErrors((current) => ({ ...current, address: undefined }))
                          }}
                          role="radio"
                          type="button"
                        >
                          {isActive ? (
                            <motion.span
                              className="absolute right-3 top-3 h-2 w-2 rounded-full bg-gold"
                              layoutId="delivery-active-dot"
                            />
                          ) : null}
                          <span className="block font-body text-sm font-semibold text-ink">
                            {option.label}
                          </span>
                          <span className="mt-2 block font-body text-xs leading-relaxed text-ink-muted">
                            {option.description}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <AnimatePresence>
                  {form.deliveryType !== 'Recojo en tienda' ? (
                    <motion.div
                      animate={{ height: 'auto', opacity: 1, y: 0 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0, y: -8 }}
                      initial={{ height: 0, opacity: 0, y: -8 }}
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <FloatingField
                        error={errors.address}
                        id="address"
                        label="Dirección o agencia de destino"
                        onChange={(value) => setField('address', value)}
                        value={form.address}
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <FloatingField
                  error={errors.note}
                  id="note"
                  label="Nota adicional"
                  maxLength={NOTE_LIMIT}
                  onChange={(value) => setField('note', value)}
                  value={form.note}
                />
              </div>

              <CompactOrderSummary items={items} subtotal={subtotal} />

              <motion.button
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 font-body text-sm font-semibold text-white shadow-[0_16px_38px_rgba(37,211,102,0.22)] transition-shadow disabled:pointer-events-none disabled:opacity-60"
                disabled={isSending || !items.length}
                type="submit"
                whileHover={{ scale: items.length ? 1.02 : 1 }}
                whileTap={{ scale: items.length ? 0.98 : 1 }}
              >
                {isSending ? <Spinner /> : <WhatsAppIcon />}
                {isSending ? 'Preparando pedido...' : 'Enviar pedido por WhatsApp'}
              </motion.button>
            </form>
          </aside>
        </div>
      </div>

      <ConfirmationOverlay open={confirmationOpen} />
    </main>
  )
}
