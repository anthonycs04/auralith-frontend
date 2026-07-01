import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Radio,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  orderSourceLabels,
  orderStatusLabels,
  useAdminStore,
  type AdminOrderSource,
  type AdminOrderStatus,
} from '../../store'
import { cn } from '../../components/ui/utils'

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

const statusColors: Record<AdminOrderStatus, string> = {
  cancelled: '#ef4444',
  confirmed: '#8FA58C',
  contacted: '#9F8F7E',
  delivered: '#B5C9B2',
  new: '#C9A86A',
  preparing: '#DFC08A',
}

const channelColors: Record<AdminOrderSource, string> = {
  store: '#F5F1E8',
  tiktok: '#8FA58C',
  web: '#C9A86A',
}

function CountValue({
  formatter,
  value,
}: {
  formatter?: (value: number) => string
  value: number
}) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) =>
    formatter ? formatter(latest) : Math.round(latest).toString(),
  )

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
    })

    return () => controls.stop()
  }, [motionValue, value])

  return <motion.span>{rounded}</motion.span>
}

function MetricCard({
  accent,
  detail,
  formatter,
  icon,
  label,
  value,
}: {
  accent: string
  detail: string
  formatter?: (value: number) => string
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/5 bg-[#242424] p-5"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {icon}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 font-body text-[10px] uppercase tracking-widest text-sage-light">
          <ArrowUpRight className="h-3 w-3" />
          {detail}
        </span>
      </div>
      <p className="mt-5 font-body text-xs uppercase tracking-widest text-cream-dark/55">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl leading-none text-cream">
        <CountValue formatter={formatter} value={value} />
      </p>
    </motion.article>
  )
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

export function AdminDashboardPage() {
  const products = useAdminStore((state) => state.products)
  const orders = useAdminStore((state) => state.orders)
  const activeOrders = orders.filter((order) => order.status !== 'cancelled')
  const lowStockProducts = products.filter((product) => product.stock <= 5)
  const totalRevenue = activeOrders.reduce((total, order) => total + order.total, 0)
  const channelData = (
    ['web', 'tiktok', 'store'] as AdminOrderSource[]
  ).map((source) => {
    const channelOrders = activeOrders.filter((order) => order.source === source)

    return {
      fill: channelColors[source],
      name: orderSourceLabels[source],
      pedidos: channelOrders.length,
      ventas: channelOrders.reduce((total, order) => total + order.total, 0),
    }
  })
  const sourceCounts = Object.fromEntries(
    channelData.map((channel) => [
      channel.name,
      channel.pedidos,
    ]),
  ) as Record<string, number>
  const averageTicket = activeOrders.length ? totalRevenue / activeOrders.length : 0
  const statusData = (
    [
      'new',
      'contacted',
      'confirmed',
      'preparing',
      'delivered',
      'cancelled',
    ] as AdminOrderStatus[]
  ).map((status) => ({
    count: orders.filter((order) => order.status === status).length,
    fill: statusColors[status],
    name: orderStatusLabels[status],
  }))
  const productSales = new Map<
    string,
    { name: string; revenue: number; units: number }
  >()

  activeOrders.forEach((order) => {
    order.items.forEach((item) => {
      const current = productSales.get(item.productId) ?? {
        name: item.name,
        revenue: 0,
        units: 0,
      }

      productSales.set(item.productId, {
        ...current,
        revenue: current.revenue + item.price * item.quantity,
        units: current.units + item.quantity,
      })
    })
  })

  const topProducts = [...productSales.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 4)

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Panel de control
          </p>
          <h1 className="mt-2 font-display text-4xl text-cream">
            Métricas y operación
          </h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-cream-dark/60">
            Ventas de web, TikTok y tienda física conectadas al mismo inventario.
          </p>
        </div>
        <p className="font-body text-sm text-cream-dark/60">
          Actualizado{' '}
          {new Intl.DateTimeFormat('es-PE', {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(new Date())}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          accent="#C9A86A"
          detail={`${activeOrders.length} ventas`}
          formatter={(value) => currencyFormatter.format(Math.round(value))}
          icon={<Banknote className="h-5 w-5" />}
          label="Monto vendido"
          value={totalRevenue}
        />
        <MetricCard
          accent="#C9A86A"
          detail="canal web"
          icon={<ShoppingBag className="h-5 w-5" />}
          label="Pedidos web"
          value={sourceCounts.Web ?? 0}
        />
        <MetricCard
          accent="#8FA58C"
          detail="captura live"
          icon={<Radio className="h-5 w-5" />}
          label="Pedidos TikTok"
          value={sourceCounts['TikTok Live'] ?? 0}
        />
        <MetricCard
          accent="#F5F1E8"
          detail="venta directa"
          icon={<Store className="h-5 w-5" />}
          label="Ventas en tienda"
          value={sourceCounts.Tienda ?? 0}
        />
        <MetricCard
          accent="#ef4444"
          detail="reponer"
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Bajo stock"
          value={lowStockProducts.length}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-cream">
                Ventas por canal
              </h2>
              <p className="mt-1 font-body text-xs text-cream-dark/50">
                Comparación de monto registrado en cada origen.
              </p>
            </div>
            <span className="rounded-full border border-gold/25 px-3 py-1 font-body text-xs text-gold">
              Ticket promedio {currencyFormatter.format(Math.round(averageTicket))}
            </span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={channelData}
                margin={{ bottom: 8, left: 8, right: 20, top: 8 }}
              >
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  stroke="rgba(232,226,214,0.55)"
                  tickLine={false}
                />
                <YAxis stroke="rgba(232,226,214,0.45)" tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1A1A1A',
                    border: '1px solid rgba(201,168,106,0.25)',
                    borderRadius: 12,
                    color: '#F5F1E8',
                  }}
                />
                <Bar dataKey="ventas" isAnimationActive radius={[8, 8, 0, 0]}>
                  {channelData.map((entry) => (
                    <Cell fill={entry.fill} key={entry.name} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#242424] p-5">
          <h2 className="font-display text-2xl text-cream">Top productos</h2>
          <div className="mt-5 space-y-3">
            {topProducts.map((product, index) => (
              <div
                className="rounded-xl border border-white/10 bg-[#191919] p-4"
                key={product.name}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-widest text-gold">
                      #{index + 1} · Todos los canales
                    </p>
                    <h3 className="mt-1 font-body text-sm font-semibold text-cream">
                      {product.name}
                    </h3>
                  </div>
                  <span className="font-body text-sm font-semibold text-gold">
                    {currencyFormatter.format(product.revenue)}
                  </span>
                </div>
                <p className="mt-2 font-body text-xs text-cream-dark/55">
                  {product.units} unidades vendidas
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-white/5 bg-[#242424] p-5">
        <h2 className="font-display text-2xl text-cream">Pedidos por estado</h2>
        <div className="mt-5 h-[300px]">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={statusData}
              layout="vertical"
              margin={{ bottom: 8, left: 12, right: 20, top: 8 }}
            >
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis
                allowDecimals={false}
                stroke="rgba(232,226,214,0.45)"
                type="number"
              />
              <YAxis
                dataKey="name"
                stroke="rgba(232,226,214,0.65)"
                tickLine={false}
                type="category"
                width={92}
              />
              <Tooltip
                contentStyle={{
                  background: '#1A1A1A',
                  border: '1px solid rgba(201,168,106,0.25)',
                  borderRadius: 12,
                  color: '#F5F1E8',
                }}
              />
              <Bar dataKey="count" isAnimationActive radius={[0, 8, 8, 0]}>
                {statusData.map((entry) => (
                  <Cell fill={entry.fill} key={entry.name} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-white/5 bg-[#242424]">
        <div className="border-b border-white/5 px-5 py-4">
          <h2 className="font-display text-2xl text-cream">Últimos movimientos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="text-left font-body text-[11px] uppercase tracking-widest text-cream-dark/45">
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Canal</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((order) => (
                <tr
                  className="border-t border-white/5 transition-colors hover:bg-white/5"
                  key={order.id}
                >
                  <td className="px-5 py-4 font-body text-sm font-semibold text-cream">
                    {order.code}
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-cream-dark">
                    {order.customer}
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-gold">
                    {currencyFormatter.format(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 font-body text-xs uppercase tracking-widest text-cream-dark">
                    {orderSourceLabels[order.source]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
