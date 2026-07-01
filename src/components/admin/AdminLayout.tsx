import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileText,
  KeyRound,
  Lock,
  LogOut,
  Package,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react'
import { useEffect, type ComponentType } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  useAdminAuthStore,
  useAdminStore,
  type AdminToast,
} from '../../store'
import { cn } from '../ui/utils'

type AdminNavItem = {
  helper?: string
  icon: ComponentType<{ className?: string }>
  label: string
  notifications?: number
  to: string
}

const primaryNavItems: AdminNavItem[] = [
  {
    helper: 'KPIs y rendimiento',
    icon: BarChart3,
    label: 'Métricas',
    to: '/admin',
  },
  {
    helper: 'Productos y categorías',
    icon: Package,
    label: 'Catálogo',
    to: '/admin/productos',
  },
  {
    helper: 'Web + historial',
    icon: ShoppingBag,
    label: 'Pedidos',
    to: '/admin/pedidos',
  },
  {
    helper: 'Hero, FAQs y testimonios',
    icon: FileText,
    label: 'Contenido',
    to: '/admin/contenido',
  },
]

function ToastIcon({ variant }: { variant: AdminToast['variant'] }) {
  if (variant === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-sage" />
  }

  if (variant === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-gold" />
  }

  return <AlertTriangle className="h-4 w-4 text-red-400" />
}

function ToastCard({ toast }: { toast: AdminToast }) {
  const dismissToast = useAdminStore((state) => state.dismissToast)

  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(toast.id), 3000)

    return () => window.clearTimeout(timeout)
  }, [dismissToast, toast.id])

  return (
    <motion.div
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={cn(
        'flex w-[320px] items-start gap-3 rounded-xl border bg-[#242424] p-4 text-cream-light shadow-lifted',
        toast.variant === 'success' && 'border-sage/40',
        toast.variant === 'warning' && 'border-gold/40',
        toast.variant === 'error' && 'border-red-400/40',
      )}
      exit={{ opacity: 0, x: 48, y: -8 }}
      initial={{ opacity: 0, x: 48, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <ToastIcon variant={toast.variant} />
      <div className="min-w-0 flex-1">
        <p className="font-body text-sm font-semibold text-cream-light">
          {toast.title}
        </p>
        <p className="mt-1 font-body text-xs leading-relaxed text-cream-dark/75">
          {toast.message}
        </p>
      </div>
      <button
        aria-label="Cerrar notificación"
        className="grid h-7 w-7 place-items-center rounded-full text-cream-dark/70 transition-colors hover:bg-white/5 hover:text-cream-light"
        onClick={() => dismissToast(toast.id)}
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function ToastViewport() {
  const toasts = useAdminStore((state) => state.toasts)

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[140] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div className="pointer-events-auto" key={toast.id}>
            <ToastCard toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function AdminNavLink({ item }: { item: AdminNavItem }) {
  const Icon = item.icon

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-r-xl border-l-[3px] border-transparent px-4 py-3 font-body text-sm text-cream-dark/70 transition-colors hover:bg-white/5 hover:text-cream-light',
          isActive &&
            'border-l-gold bg-gold/10 text-gold hover:bg-gold/10 hover:text-gold',
        )
      }
      end={item.to === '/admin'}
      to={item.to}
    >
      <Icon className="h-4 w-4" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.label}</span>
        {item.helper ? (
          <span className="mt-0.5 block truncate text-[10px] text-cream-dark/35">
            {item.helper}
          </span>
        ) : null}
      </span>
      {item.notifications ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 font-body text-[10px] font-semibold text-ink">
          {item.notifications}
        </span>
      ) : null}
    </NavLink>
  )
}

/** Administrative shell backed by Supabase Auth and the Auralith API. */
export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const checkSession = useAdminAuthStore((state) => state.checkSession)
  const logout = useAdminAuthStore((state) => state.logout)
  const user = useAdminAuthStore((state) => state.user)
  const hydrate = useAdminStore((state) => state.hydrate)
  const newOrdersCount = useAdminStore(
    (state) => state.orders.filter((order) => order.status === 'new').length,
  )
  const isAccessRoute =
    location.pathname === '/admin/login' || location.pathname === '/admin/acceso'

  useEffect(() => {
    if (isAccessRoute) {
      return
    }

    void checkSession().then((valid) => {
      if (!valid) {
        navigate('/admin/login', { replace: true })
        return
      }

      void hydrate()
    })
  }, [checkSession, hydrate, isAccessRoute, navigate])

  return (
    <div className="min-h-screen bg-[#111111] text-cream-light">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-white/5 bg-[#1A1A1A] lg:flex">
        <div className="border-b border-white/5 px-6 py-6">
          <p className="font-display text-xl tracking-widest text-cream">AURALITH</p>
          <p className="mt-1 font-body text-[10px] uppercase tracking-[0.28em] text-gold">
            Centro de operaciones
          </p>
        </div>

        <div className="border-b border-white/5 px-4 py-4">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dark/35" />
            <input
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3 font-body text-xs text-cream outline-none transition-colors placeholder:text-cream-dark/30 focus:border-gold"
              placeholder="Buscar pedido, SKU, cliente"
            />
          </label>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Admin">
          {primaryNavItems.map((item) => (
            <AdminNavLink
              item={{
                ...item,
                notifications:
                  item.to === '/admin/pedidos' ? newOrdersCount : item.notifications,
              }}
              key={item.label}
            />
          ))}
        </nav>

        <div className="space-y-3 border-t border-white/5 p-4">
          <NavLink
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-xs text-cream-dark/65 transition-colors hover:border-gold/35 hover:text-gold',
                isActive && 'border-gold/40 bg-gold/10 text-gold',
              )
            }
            to="/admin/acceso"
          >
            <Lock className="h-4 w-4" />
            <span className="min-w-0 flex-1">
              <span className="block uppercase tracking-widest">Área oculta</span>
              <span className="mt-1 block text-[10px] text-cream-dark/35">
                Login interno de diseño
              </span>
            </span>
            <KeyRound className="h-3.5 w-3.5" />
          </NavLink>

          <div className="rounded-xl bg-white/[0.03] p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gold text-sm font-semibold text-ink">
                AU
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-semibold text-cream">
                  {user?.displayName ?? 'Tienda Auralith'}
                </p>
                <p className="font-body text-xs text-cream-dark/55">
                  {user?.role === 'admin' ? 'Administrador' : 'Editor'}
                </p>
              </div>
              <button
                aria-label="Cerrar sesión"
                className="grid h-8 w-8 place-items-center rounded-full text-gold transition-colors hover:bg-gold/10"
                onClick={() => {
                  logout()
                  navigate('/admin/login', { replace: true })
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="border-b border-white/5 bg-[#1A1A1A] px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg tracking-widest text-cream">AURALITH</p>
            <p className="font-body text-[10px] uppercase tracking-widest text-gold">
              Admin visual
            </p>
          </div>
          <NavLink
            className="rounded-full border border-gold/30 px-4 py-2 font-body text-xs text-gold"
            to="/admin/acceso"
          >
            Acceso
          </NavLink>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Admin mobile">
          {primaryNavItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-full border border-white/10 px-3 py-2 font-body text-xs text-cream-dark/70',
                  isActive && 'border-gold bg-gold/10 text-gold',
                )
              }
              end={item.to === '/admin'}
              key={item.label}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="lg:pl-64">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            initial={{ opacity: 0, y: 8 }}
            key={`${location.pathname}-${location.search}`}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="pointer-events-none fixed bottom-5 right-5 z-40 hidden rounded-full border border-gold/20 bg-[#1A1A1A]/85 px-4 py-2 font-body text-[11px] uppercase tracking-widest text-gold backdrop-blur-md xl:flex">
        <FileText className="mr-2 h-3.5 w-3.5" />
        Conectado a Supabase
      </div>

      <ToastViewport />
    </div>
  )
}
