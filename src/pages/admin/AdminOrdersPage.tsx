import {
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Radio,
  ReceiptText,
  Save,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import { useMemo, useState } from 'react'
import {
  orderSourceLabels,
  orderStatusLabels,
  shippingMethods,
  useAdminStore,
  type AdminOrder,
  type AdminOrderItem,
  type AdminOrderSource,
  type AdminOrderStatus,
  type AdminProduct,
  type ShippingMethod,
} from '../../store'
import { cn } from '../../components/ui/utils'

type OrderView = 'all' | AdminOrderSource

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

const orderStatusFlow: AdminOrderStatus[] = [
  'new',
  'contacted',
  'confirmed',
  'preparing',
  'delivered',
]

const sourceClasses: Record<AdminOrderSource, string> = {
  store: 'bg-cream/10 text-cream ring-cream/20',
  tiktok: 'bg-sage/15 text-sage-light ring-sage/25',
  web: 'bg-gold/15 text-gold ring-gold/25',
}

function orderTotal(items: AdminOrderItem[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

function makeOrderItem(product: AdminProduct): AdminOrderItem {
  return {
    name: product.name,
    price: product.offerPrice ?? product.price,
    productId: product.id,
    quantity: 1,
  }
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function writePdfText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 4,
) {
  const lines = doc.splitTextToSize(text || '-', maxWidth)
  doc.text(lines, x, y)

  return y + lines.length * lineHeight
}

function downloadOrderInfo(order: AdminOrder) {
  const doc = new jsPDF({
    format: [100, 150],
    orientation: 'portrait',
    unit: 'mm',
  })
  const createdAt = new Date(order.createdAt)
  const createdLabel = createdAt.toLocaleString('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
  const productsLabel = order.items
    .map(
      (item) =>
        `${item.quantity} x ${item.name} - ${currencyFormatter.format(item.price * item.quantity)}`,
    )
    .join('\n')

  doc.setFillColor(245, 241, 232)
  doc.rect(0, 0, 100, 150, 'F')
  doc.setDrawColor(201, 168, 106)
  doc.setLineWidth(0.7)
  doc.roundedRect(5, 5, 90, 140, 3, 3, 'S')
  doc.setTextColor(34, 34, 34)
  doc.setFont('times', 'bold')
  doc.setFontSize(19)
  doc.text('AURALITH', 10, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(168, 133, 74)
  doc.text('ETIQUETA DE PEDIDO', 10, 23)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(34, 34, 34)
  doc.text(order.code, 90, 16, { align: 'right' })
  doc.setFontSize(7)
  doc.setTextColor(107, 138, 104)
  doc.text(orderSourceLabels[order.source].toUpperCase(), 90, 21, {
    align: 'right',
  })
  doc.setDrawColor(201, 168, 106)
  doc.line(10, 28, 90, 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(168, 133, 74)
  doc.text('CLIENTE', 10, 35)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(34, 34, 34)
  const y = writePdfText(doc, order.customer, 10, 41, 78, 4.4)
  doc.setFontSize(8)
  doc.setTextColor(61, 61, 61)
  doc.text(`WhatsApp: ${order.whatsapp || 'No registrado'}`, 10, y + 2)
  doc.text(`DNI: ${order.documentNumber || 'No registrado'}`, 10, y + 7)
  doc.text(`Ciudad: ${order.city}`, 10, y + 12)
  doc.text(`Envio: ${order.deliveryType}`, 10, y + 17)
  doc.text(`Estado: ${orderStatusLabels[order.status]}`, 10, y + 22)
  doc.text(`Fecha: ${createdLabel}`, 10, y + 27)

  doc.setFillColor(250, 248, 243)
  doc.roundedRect(10, 73, 80, 35, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(168, 133, 74)
  doc.text('PRODUCTOS', 13, 80)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(34, 34, 34)
  writePdfText(doc, productsLabel, 13, 86, 74, 4)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(168, 133, 74)
  doc.text('NOTA', 10, 114)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(61, 61, 61)
  writePdfText(doc, order.note || 'Sin nota', 10, 120, 80, 4)

  doc.setFillColor(34, 34, 34)
  doc.roundedRect(10, 132, 80, 9, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(245, 241, 232)
  doc.text('TOTAL', 14, 138)
  doc.text(currencyFormatter.format(order.total), 86, 138, { align: 'right' })
  doc.save(`${order.code}-etiqueta-auralith.pdf`)
}

function StatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-widest',
        status === 'new' && 'bg-gold/15 text-gold',
        status === 'confirmed' && 'bg-sage/15 text-sage-light',
        status === 'cancelled' && 'bg-red-500/15 text-red-300',
        status !== 'new' &&
          status !== 'confirmed' &&
          status !== 'cancelled' &&
          'bg-white/10 text-cream-dark',
      )}
    >
      {orderStatusLabels[status]}
    </span>
  )
}

function SourceBadge({ source }: { source: AdminOrderSource }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-widest ring-1',
        sourceClasses[source],
      )}
    >
      {orderSourceLabels[source]}
    </span>
  )
}

function OrderProgress({ status }: { status: AdminOrderStatus }) {
  const currentIndex = status === 'cancelled' ? -1 : orderStatusFlow.indexOf(status)

  return (
    <div className="rounded-xl border border-white/10 bg-[#191919] p-4">
      <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
        Rastreo interno
      </p>
      <div className="mt-4 grid gap-3">
        {status === 'cancelled' ? (
          <div className="rounded-xl bg-red-500/10 px-4 py-3 font-body text-sm text-red-300">
            Pedido cancelado. Se conserva en el historial.
          </div>
        ) : (
          orderStatusFlow.map((step, index) => {
            const completed = index <= currentIndex

            return (
              <div className="flex items-center gap-3" key={step}>
                <span
                  className={cn(
                    'grid h-7 w-7 place-items-center rounded-full border',
                    completed
                      ? 'border-gold bg-gold text-ink'
                      : 'border-white/10 text-cream-dark/40',
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    'font-body text-sm',
                    completed ? 'text-cream' : 'text-cream-dark/45',
                  )}
                >
                  {orderStatusLabels[step]}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ProductRows({
  compact = false,
  items,
  onChange,
  onRemove,
}: {
  compact?: boolean
  items: AdminOrderItem[]
  onChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          className={cn(
            'grid min-w-0 items-center rounded-xl bg-[#191919]',
            compact
              ? 'grid-cols-[minmax(0,1fr)_64px_36px] gap-2 px-2.5 py-2.5'
              : 'gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_88px_auto]',
          )}
          key={item.productId}
        >
          <div className="min-w-0">
            <p
              className={cn(
                'truncate font-body font-semibold text-cream',
                compact ? 'text-xs' : 'text-sm',
              )}
              title={item.name}
            >
              {item.name}
            </p>
            <p className="mt-1 truncate font-body text-[11px] text-cream-dark/50">
              {currencyFormatter.format(item.price)} c/u
            </p>
          </div>
          <input
            aria-label={`Cantidad de ${item.name}`}
            className={cn(
              'h-9 min-w-0 rounded-lg border border-white/10 bg-[#111111] font-body text-sm text-cream outline-none focus:border-gold',
              compact ? 'px-2 text-center' : 'px-3',
            )}
            min={1}
            onChange={(event) =>
              onChange(item.productId, Math.max(1, Number(event.target.value)))
            }
            type="number"
            value={item.quantity}
          />
          <button
            aria-label={`Quitar ${item.name}`}
            className="grid h-9 w-9 place-items-center rounded-full text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
            onClick={() => onRemove(item.productId)}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

function ProductPicker({
  compact = false,
  onAdd,
  products,
}: {
  compact?: boolean
  onAdd: (product: AdminProduct) => void
  products: AdminProduct[]
}) {
  const availableProducts = products.filter((product) => product.stock > 0)
  const [query, setQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState(
    availableProducts[0]?.id ?? '',
  )
  const normalizedQuery = normalizeSearch(query)
  const filteredProducts = availableProducts.filter((product) => {
    if (!normalizedQuery) return true

    return normalizeSearch(
      [product.name, product.sku, product.tags.join(' ')].join(' '),
    ).includes(normalizedQuery)
  })
  const visibleProducts = filteredProducts.slice(0, normalizedQuery ? 80 : 35)
  const effectiveSelectedProductId = visibleProducts.some(
    (product) => product.id === selectedProductId,
  )
    ? selectedProductId
    : visibleProducts[0]?.id ?? ''

  const selectedProduct = visibleProducts.find(
    (product) => product.id === effectiveSelectedProductId,
  )

  return (
    <div className="grid min-w-0 gap-2">
      <label className="relative block min-w-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dark/45" />
        <input
          className={cn(
            'h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#191919] pl-10 pr-3 font-body text-cream outline-none transition-colors placeholder:text-cream-dark/35 focus:border-gold',
            compact ? 'text-xs' : 'text-sm',
          )}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            compact ? 'Buscar producto' : 'Buscar producto por nombre, SKU o etiqueta'
          }
          value={query}
        />
      </label>
      <div
        className={cn(
          'grid min-w-0 gap-2',
          compact
            ? 'grid-cols-[minmax(0,1fr)_44px]'
            : 'sm:grid-cols-[minmax(0,1fr)_auto]',
        )}
      >
      <select
        className={cn(
          'h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#191919] font-body text-cream outline-none focus:border-gold disabled:opacity-50',
          compact ? 'px-3 text-xs' : 'px-4 text-sm',
        )}
        disabled={!visibleProducts.length}
        onChange={(event) => setSelectedProductId(event.target.value)}
        value={effectiveSelectedProductId}
      >
        {!visibleProducts.length ? <option value="">Sin resultados</option> : null}
        {visibleProducts.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name} · Stock {product.stock} ·{' '}
            {currencyFormatter.format(product.offerPrice ?? product.price)}
          </option>
        ))}
      </select>
      <button
        aria-label="Agregar producto al pedido"
        className={cn(
          'inline-flex h-11 items-center justify-center rounded-xl border border-gold/40 font-body text-sm text-gold transition-colors hover:bg-gold/10 disabled:opacity-40',
          compact ? 'w-11 px-0' : 'gap-2 px-4',
        )}
        disabled={!selectedProduct}
        onClick={() => selectedProduct && onAdd(selectedProduct)}
        type="button"
      >
        <Plus className="h-4 w-4" />
        {compact ? null : 'Agregar'}
      </button>
      </div>
      {availableProducts.length > visibleProducts.length ? (
        <p className="font-body text-[11px] text-cream-dark/45">
          Mostrando {visibleProducts.length} de {filteredProducts.length} resultados.
          Escribe para encontrar productos mas rapido.
        </p>
      ) : null}
    </div>
  )
}

function ManualOrderBuilder({
  onCreate,
  products,
}: {
  onCreate: (order: AdminOrder) => Promise<boolean>
  products: AdminProduct[]
}) {
  const [source, setSource] = useState<Exclude<AdminOrderSource, 'web'>>('tiktok')
  const [customer, setCustomer] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [city, setCity] = useState('')
  const [deliveryType, setDeliveryType] =
    useState<ShippingMethod>('Recojo en tienda')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<AdminOrderItem[]>([])
  const [sequences, setSequences] = useState({ store: 319, tiktok: 2042 })
  const total = orderTotal(items)

  const addProduct = (product: AdminProduct) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)

      return existing
        ? current.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, makeOrderItem(product)]
    })
  }

  const createOrder = async () => {
    const isStore = source === 'store'

    if ((!isStore && !customer.trim()) || !items.length) {
      return
    }

    const sequence = sequences[source]
    const order: AdminOrder = {
      city: city.trim() || (isStore ? 'Tacna' : 'Por coordinar'),
      code: `${isStore ? 'POS' : 'TT'}-${sequence}`,
      createdAt: new Date().toISOString(),
      customer: customer.trim() || 'Venta mostrador',
      deliveryType: isStore ? 'Recojo en tienda' : deliveryType,
      documentNumber: documentNumber.trim() || undefined,
      id: `${source}-${sequence}`,
      items,
      note: note.trim() || undefined,
      source,
      status: isStore ? 'delivered' : 'new',
      total,
      whatsapp: whatsapp.trim(),
    }

    if (await onCreate(order)) {
      setCustomer('')
      setDocumentNumber('')
      setWhatsapp('')
      setCity('')
      setDeliveryType('Recojo en tienda')
      setNote('')
      setItems([])
      setSequences((current) => ({
        ...current,
        [source]: current[source] + 1,
      }))
    }
  }

  return (
    <section className="rounded-xl border border-sage/20 bg-sage/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sage/20 text-sage-light">
            {source === 'tiktok' ? (
              <Radio className="h-5 w-5" />
            ) : (
              <Store className="h-5 w-5" />
            )}
          </span>
          <div>
            <h2 className="font-display text-2xl text-cream">
              Registrar venta manual
            </h2>
            <p className="mt-1 font-body text-xs text-cream-dark/60">
              TikTok y tienda física descuentan del mismo stock global.
            </p>
          </div>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-[#191919] p-1">
          {[
            { icon: Radio, label: 'TikTok', value: 'tiktok' },
            { icon: Store, label: 'Tienda', value: 'store' },
          ].map((option) => {
            const Icon = option.icon
            const active = source === option.value

            return (
              <button
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-lg px-3 font-body text-xs transition-colors',
                  active ? 'bg-gold text-ink' : 'text-cream-dark hover:text-cream',
                )}
                key={option.value}
                onClick={() =>
                  setSource(option.value as Exclude<AdminOrderSource, 'web'>)
                }
                type="button"
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
          onChange={(event) => setCustomer(event.target.value)}
          placeholder={
            source === 'store' ? 'Cliente (opcional)' : 'Nombre o usuario TikTok'
          }
          value={customer}
        />
        <input
          className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
          onChange={(event) => setWhatsapp(event.target.value)}
          placeholder="WhatsApp (opcional)"
          value={whatsapp}
        />
        <input
          className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
          inputMode="numeric"
          maxLength={8}
          onChange={(event) =>
            setDocumentNumber(event.target.value.replace(/\D/g, '').slice(0, 8))
          }
          placeholder="DNI (opcional)"
          value={documentNumber}
        />
        <input
          className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
          onChange={(event) => setCity(event.target.value)}
          placeholder="Ciudad"
          value={city}
        />
        <select
          className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold disabled:opacity-50"
          disabled={source === 'store'}
          onChange={(event) =>
            setDeliveryType(event.target.value as ShippingMethod)
          }
          value={source === 'store' ? 'Recojo en tienda' : deliveryType}
        >
          {shippingMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <ProductPicker onAdd={addProduct} products={products} />
      </div>
      <div className="mt-4">
        {items.length ? (
          <ProductRows
            items={items}
            onChange={(productId, quantity) =>
              setItems((current) =>
                current.map((item) =>
                  item.productId === productId ? { ...item, quantity } : item,
                ),
              )
            }
            onRemove={(productId) =>
              setItems((current) =>
                current.filter((item) => item.productId !== productId),
              )
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center font-body text-xs text-cream-dark/45">
            Selecciona los productos de la venta.
          </div>
        )}
      </div>

      <textarea
        className="mt-4 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-[#191919] px-4 py-3 font-body text-sm text-cream outline-none focus:border-gold"
        onChange={(event) => setNote(event.target.value)}
        placeholder="Nota del pedido"
        value={note}
      />

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-cream-dark/45">
            Canal
          </p>
          <p className="mt-1 font-body text-sm font-semibold text-sage-light">
            {orderSourceLabels[source]}
          </p>
        </div>
        <span className="font-display text-3xl text-gold">
          {currencyFormatter.format(total)}
        </span>
      </div>
      <button
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:pointer-events-none disabled:opacity-50"
        disabled={(source === 'tiktok' && !customer.trim()) || !items.length}
        onClick={createOrder}
        type="button"
      >
        {source === 'tiktok' ? (
          <Radio className="h-4 w-4" />
        ) : (
          <Store className="h-4 w-4" />
        )}
        Registrar {source === 'tiktok' ? 'pedido TikTok' : 'venta en tienda'}
      </button>
    </section>
  )
}

function OrderItemsEditor({
  onCancel,
  onSave,
  order,
  products,
}: {
  onCancel: () => void
  onSave: (items: AdminOrderItem[]) => Promise<boolean>
  order: AdminOrder
  products: AdminProduct[]
}) {
  const [items, setItems] = useState<AdminOrderItem[]>(order.items)

  const addProduct = (product: AdminProduct) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)

      return existing
        ? current.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...current, makeOrderItem(product)]
    })
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gold/30 bg-gold/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Editar productos
          </p>
          <p className="mt-1 font-body text-xs text-cream-dark/55">
            El total y el stock se recalculan al guardar.
          </p>
        </div>
        <button
          aria-label="Cancelar edición"
          className="grid h-9 w-9 place-items-center rounded-full text-cream-dark hover:bg-white/5 hover:text-cream"
          onClick={onCancel}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">
        <ProductPicker compact onAdd={addProduct} products={products} />
      </div>
      <div className="mt-4">
        <ProductRows
          compact
          items={items}
          onChange={(productId, quantity) =>
            setItems((current) =>
              current.map((item) =>
                item.productId === productId ? { ...item, quantity } : item,
              ),
            )
          }
          onRemove={(productId) =>
            setItems((current) =>
              current.filter((item) => item.productId !== productId),
            )
          }
        />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gold/15 pt-4">
        <span className="font-body text-xs uppercase tracking-widest text-cream-dark/50">
          Nuevo total
        </span>
        <span className="font-display text-2xl text-gold">
          {currencyFormatter.format(orderTotal(items))}
        </span>
      </div>
      <button
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-gold px-4 font-body text-sm font-semibold text-ink disabled:opacity-40"
        disabled={!items.length}
        onClick={async () => {
          if (await onSave(items)) {
            onCancel()
          }
        }}
        type="button"
      >
        <Save className="h-4 w-4" />
        Guardar productos
      </button>
    </div>
  )
}

function OrderDetailPanel({
  onDownload,
  onItemsSave,
  onStatusChange,
  order,
  products,
}: {
  onDownload: (order: AdminOrder) => void
  onItemsSave: (
    order: AdminOrder,
    items: AdminOrderItem[],
  ) => Promise<boolean>
  onStatusChange: (
    order: AdminOrder,
    status: AdminOrderStatus,
  ) => Promise<void>
  order: AdminOrder | null
  products: AdminProduct[]
}) {
  const [editing, setEditing] = useState(false)

  if (!order) {
    return (
      <aside className="rounded-xl border border-white/5 bg-[#242424] p-6">
        <ClipboardList className="h-9 w-9 text-gold" />
        <h2 className="mt-4 font-display text-2xl text-cream">
          Selecciona un pedido
        </h2>
        <p className="mt-2 font-body text-sm leading-relaxed text-cream-dark/60">
          Aquí podrás revisar el envío, editar productos y descargar su etiqueta.
        </p>
      </aside>
    )
  }

  return (
    <aside className="min-w-0 space-y-4">
      <section className="rounded-xl border border-white/5 bg-[#242424] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
              Detalle seleccionado
            </p>
            <h2 className="mt-2 font-display text-3xl text-cream">
              {order.customer}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <SourceBadge source={order.source} />
              <StatusBadge status={order.status} />
            </div>
          </div>
          <p className="font-body text-sm font-semibold text-gold">{order.code}</p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#191919] p-3">
            <p className="flex items-center gap-2 font-body text-xs uppercase tracking-widest text-cream-dark/45">
              <Phone className="h-3.5 w-3.5" />
              WhatsApp
            </p>
            <p className="mt-2 font-body text-sm text-cream">
              {order.whatsapp || 'No registrado'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#191919] p-3">
            <p className="flex items-center gap-2 font-body text-xs uppercase tracking-widest text-cream-dark/45">
              <ClipboardList className="h-3.5 w-3.5" />
              DNI
            </p>
            <p className="mt-2 font-body text-sm text-cream">
              {order.documentNumber || 'No registrado'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#191919] p-3">
            <p className="flex items-center gap-2 font-body text-xs uppercase tracking-widest text-cream-dark/45">
              <MapPin className="h-3.5 w-3.5" />
              Ciudad
            </p>
            <p className="mt-2 font-body text-sm text-cream">{order.city}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#191919] p-3">
            <p className="flex items-center gap-2 font-body text-xs uppercase tracking-widest text-cream-dark/45">
              <Truck className="h-3.5 w-3.5" />
              Método de envío
            </p>
            <p className="mt-2 font-body text-sm text-cream">
              {order.deliveryType}
            </p>
          </div>
          <label className="rounded-xl border border-white/10 bg-[#191919] p-3">
            <span className="block font-body text-xs uppercase tracking-widest text-cream-dark/45">
              Estado
            </span>
            <select
              className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-[#111111] px-3 font-body text-sm text-cream outline-none focus:border-gold"
              onChange={(event) =>
                onStatusChange(order, event.target.value as AdminOrderStatus)
              }
              value={order.status}
            >
              {Object.entries(orderStatusLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <OrderProgress status={order.status} />

      <section className="rounded-xl border border-white/5 bg-[#242424] p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Productos del pedido
          </h3>
          {!editing ? (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-full border border-gold/30 px-3 font-body text-xs text-gold hover:bg-gold/10"
              onClick={() => setEditing(true)}
              type="button"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          ) : null}
        </div>

        {editing ? (
          <div className="mt-4">
            <OrderItemsEditor
              key={order.id}
              onCancel={() => setEditing(false)}
              onSave={(items) => onItemsSave(order, items)}
              order={order}
              products={products}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {order.items.map((item) => (
              <div
                className="flex items-center justify-between gap-4 rounded-xl bg-[#191919] px-4 py-3"
                key={item.productId}
              >
                <div>
                  <p className="font-body text-sm font-semibold text-cream">
                    {item.name}
                  </p>
                  <p className="mt-1 font-body text-xs text-cream-dark/50">
                    {item.quantity} x {currencyFormatter.format(item.price)}
                  </p>
                </div>
                <p className="font-body text-sm font-semibold text-gold">
                  {currencyFormatter.format(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}

        {order.note ? (
          <p className="mt-4 rounded-xl border border-gold/20 bg-gold/10 p-4 font-body text-sm leading-relaxed text-cream-dark">
            {order.note}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <span className="font-body text-xs uppercase tracking-widest text-cream-dark/50">
            Total
          </span>
          <span className="font-display text-3xl text-gold">
            {currencyFormatter.format(order.total)}
          </span>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gold/35 px-5 font-body text-sm text-gold hover:bg-gold/10"
          onClick={() => onDownload(order)}
          type="button"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </button>
        <a
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 font-body text-sm font-semibold text-white',
            !order.whatsapp && 'pointer-events-none opacity-40',
          )}
          href={`https://wa.me/${order.whatsapp}`}
          rel="noreferrer"
          target="_blank"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
    </aside>
  )
}

export function AdminOrdersPage() {
  const products = useAdminStore((state) => state.products)
  const orders = useAdminStore((state) => state.orders)
  const addOrder = useAdminStore((state) => state.addOrder)
  const updateOrderItems = useAdminStore((state) => state.updateOrderItems)
  const updateOrderStatus = useAdminStore((state) => state.updateOrderStatus)
  const addToast = useAdminStore((state) => state.addToast)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<OrderView>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders],
  )
  const filteredOrders = sortedOrders.filter((order) => {
    const matchesView = view === 'all' || order.source === view
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery =
      !normalizedQuery ||
      [
        order.code,
        order.customer,
        order.documentNumber ?? '',
        order.whatsapp,
        order.city,
        order.deliveryType,
        order.items.map((item) => item.name).join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)

    return matchesView && matchesQuery
  })
  const selectedOrder =
    sortedOrders.find((order) => order.id === selectedOrderId) ??
    filteredOrders[0] ??
    null
  const channelCounts = {
    store: orders.filter((order) => order.source === 'store').length,
    tiktok: orders.filter((order) => order.source === 'tiktok').length,
    web: orders.filter((order) => order.source === 'web').length,
  }

  const createManualOrder = async (order: AdminOrder) => {
    const result = await addOrder(order)

    if (!result.success) {
      addToast({
        message: result.message ?? 'Revisa el stock antes de registrar la venta.',
        title: 'No se pudo registrar',
        variant: 'error',
      })
      return false
    }

    setSelectedOrderId(order.id)
    setView(order.source)
    addToast({
      message: `${order.code} descontó ${order.items.reduce((sum, item) => sum + item.quantity, 0)} unidades del stock global.`,
      title: order.source === 'store' ? 'Venta registrada' : 'Pedido TikTok creado',
      variant: 'success',
    })
    return true
  }

  const saveOrderItems = async (
    order: AdminOrder,
    items: AdminOrderItem[],
  ) => {
    const result = await updateOrderItems(order.id, items)

    addToast({
      message: result.success
        ? 'El total y el stock global se actualizaron correctamente.'
        : result.message ?? 'No se pudo actualizar el pedido.',
      title: result.success ? 'Pedido actualizado' : 'Stock insuficiente',
      variant: result.success ? 'success' : 'error',
    })

    return result.success
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Gestión de pedidos
          </p>
          <h1 className="mt-2 font-display text-4xl text-cream">
            Web, TikTok y tienda
          </h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-cream-dark/60">
            Tres canales, un solo inventario. Registra ventas, edita productos y
            genera etiquetas sin salir del pedido.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3 rounded-xl border border-white/5 bg-[#242424] p-3 text-center">
          {[
            { label: 'Web', value: channelCounts.web },
            { label: 'TikTok', value: channelCounts.tiktok },
            { label: 'Tienda', value: channelCounts.store },
            { label: 'Total', value: orders.length },
          ].map((metric) => (
            <div key={metric.label}>
              <p className="font-display text-2xl text-gold">{metric.value}</p>
              <p className="font-body text-[10px] uppercase tracking-widest text-cream-dark/45">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="min-w-0 space-y-6">
          <ManualOrderBuilder onCreate={createManualOrder} products={products} />

          <section className="min-w-0 rounded-xl border border-white/5 bg-[#242424]">
            <div className="grid gap-3 border-b border-white/5 p-4 lg:grid-cols-[auto_1fr]">
              <div className="flex gap-2 overflow-x-auto">
                {[
                  { id: 'all', label: 'Todos', icon: ReceiptText },
                  { id: 'web', label: 'Web', icon: ShoppingBag },
                  { id: 'tiktok', label: 'TikTok', icon: Radio },
                  { id: 'store', label: 'Tienda', icon: Store },
                ].map((tab) => {
                  const Icon = tab.icon
                  const selected = view === tab.id

                  return (
                    <button
                      className={cn(
                        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 font-body text-sm transition-colors',
                        selected
                          ? 'border-gold bg-gold text-ink'
                          : 'border-white/10 text-cream-dark hover:border-gold/35 hover:text-gold',
                      )}
                      key={tab.id}
                      onClick={() => setView(tab.id as OrderView)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dark/45" />
                <input
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] pl-11 pr-4 font-body text-sm text-cream outline-none placeholder:text-cream-dark/35 focus:border-gold"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar cliente, código, agencia o producto"
                  value={query}
                />
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse">
                <thead>
                  <tr className="text-left font-body text-[11px] uppercase tracking-widest text-cream-dark/45">
                    <th className="px-5 py-3 font-medium">Código</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Canal</th>
                    <th className="px-5 py-3 font-medium">Envío</th>
                    <th className="px-5 py-3 font-medium">Productos</th>
                    <th className="px-5 py-3 font-medium">Total</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      className={cn(
                        'border-t border-white/5 transition-colors hover:bg-white/5',
                        selectedOrder?.id === order.id && 'bg-gold/5',
                      )}
                      key={order.id}
                    >
                      <td className="px-5 py-4 font-body text-sm font-semibold text-cream">
                        {order.code}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-body text-sm font-semibold text-cream">
                          {order.customer}
                        </p>
                        <p className="mt-1 font-body text-xs text-cream-dark/45">
                          {order.documentNumber
                            ? `DNI ${order.documentNumber} - ${order.city}`
                            : order.city}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <SourceBadge source={order.source} />
                      </td>
                      <td className="px-5 py-4 font-body text-sm text-cream-dark">
                        {order.deliveryType}
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-[230px] truncate font-body text-sm text-cream-dark">
                          {order.items
                            .map((item) => `${item.quantity}x ${item.name}`)
                            .join(', ')}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-body text-sm font-semibold text-gold">
                        {currencyFormatter.format(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-gold/30 px-3 font-body text-xs text-gold hover:bg-gold/10"
                            onClick={() => setSelectedOrderId(order.id)}
                            type="button"
                          >
                            <FileText className="h-4 w-4" />
                            Ver
                          </button>
                          <button
                            aria-label={`Descargar PDF de ${order.code}`}
                            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-cream-dark hover:border-gold/30 hover:text-gold"
                            onClick={() => downloadOrderInfo(order)}
                            type="button"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <OrderDetailPanel
          key={selectedOrder?.id ?? 'empty-order'}
          onDownload={(order) => {
            downloadOrderInfo(order)
            addToast({
              message: `${order.code} se descargó como etiqueta PDF.`,
              title: 'Descarga preparada',
              variant: 'success',
            })
          }}
          onItemsSave={saveOrderItems}
          onStatusChange={async (order, status) => {
            try {
              await updateOrderStatus(order.id, status)
              addToast({
                message: `${order.code} ahora está en ${orderStatusLabels[status]}.`,
                title: 'Estado actualizado',
                variant: 'success',
              })
            } catch (error) {
              addToast({
                message:
                  error instanceof Error ? error.message : 'No se pudo actualizar.',
                title: 'Error de estado',
                variant: 'error',
              })
            }
          }}
          order={selectedOrder}
          products={products}
        />
      </div>
    </div>
  )
}
