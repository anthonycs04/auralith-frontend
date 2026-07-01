import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion'
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { categories, intentions, products, type Category, type Product } from '../../data'
import {
  createInstagramUrl,
  createTelUrl,
  createWhatsAppUrl,
  formatPhoneLabel,
} from '../../lib/contact'
import { useCartStore, useCatalogStore } from '../../store'
import { cn } from '../ui/utils'
import { CartDrawer } from './CartDrawer'

type MegaMenuType = 'categories' | 'intentions'

const MotionLink = motion.create(Link)

type NavItem = {
  label: string
  mega?: MegaMenuType
  to: string
}

const navItems: NavItem[] = [
  { label: 'Inicio', to: '/' },
  { label: 'Tienda', to: '/tienda' },
  { label: 'Intenciones', mega: 'intentions', to: '/#intenciones' },
  { label: 'Categorías', mega: 'categories', to: '/#categorias' },
  { label: 'Cómo Comprar', to: '/#como-comprar' },
  { label: 'Contacto', to: '/#contacto' },
]

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

function getHeaderProductImage(product: Product) {
  return product.images.find((image) => Boolean(image.src))?.src ?? ''
}

function isNavItemActive(
  item: NavItem,
  location: { hash: string; pathname: string; search: string },
) {
  const params = new URLSearchParams(location.search)

  if (item.label === 'Inicio') {
    return location.pathname === '/' && !location.hash
  }

  if (item.label === 'Tienda') {
    return (
      location.pathname === '/tienda' &&
      !params.has('categoria') &&
      !params.has('intencion')
    )
  }

  if (item.label === 'Intenciones') {
    return (
      (location.pathname === '/' && location.hash === '#intenciones') ||
      (location.pathname === '/tienda' && params.has('intencion'))
    )
  }

  if (item.label === 'Categorías') {
    return (
      (location.pathname === '/' && location.hash === '#categorias') ||
      (location.pathname === '/tienda' && params.has('categoria'))
    )
  }

  return location.pathname === '/' && location.hash === new URL(item.to, window.location.origin).hash
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m20 20-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 8h14l-1.5 8.5a2 2 0 0 1-2 1.65H9.4a2 2 0 0 1-1.96-1.6L5.25 4.8H3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 21.5a.25.25 0 1 0 0-.5.25.25 0 0 0 0 .5ZM18 21.5a.25.25 0 1 0 0-.5.25.25 0 0 0 0 .5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 32 32"
    >
      <path d="M16.02 4C9.4 4 4.02 9.28 4.02 15.78c0 2.08.56 4.11 1.62 5.9L4 28l6.49-1.66a12.2 12.2 0 0 0 5.53 1.34C22.6 27.68 28 22.4 28 15.9 28 9.39 22.6 4 16.02 4Zm0 21.66c-1.78 0-3.52-.47-5.04-1.37l-.36-.21-3.86.99 1.03-3.67-.24-.38a9.69 9.69 0 0 1-1.5-5.24c0-5.39 4.47-9.77 9.97-9.77 5.5 0 9.97 4.44 9.97 9.89 0 5.37-4.47 9.76-9.97 9.76Zm5.46-7.3c-.3-.15-1.77-.86-2.04-.95-.27-.1-.47-.15-.67.14-.2.3-.77.95-.94 1.14-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.46-.89-.78-1.49-1.74-1.66-2.03-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.58-.92-2.16-.24-.56-.49-.48-.67-.49h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1-1.04 2.42 0 1.43 1.07 2.8 1.22 3 .15.2 2.1 3.13 5.1 4.38.71.3 1.27.48 1.7.62.72.22 1.37.19 1.89.12.58-.08 1.77-.72 2.02-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.34Z" />
    </svg>
  )
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('h-4 w-4', className)}
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3 8h10m0 0L9 4m4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function CategoryGlyph({ category }: { category: Category }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3c2 3.6 4.7 6.3 8.3 8.2-3.6 2-6.3 4.7-8.3 8.3-2-3.6-4.7-6.3-8.3-8.3C7.3 9.3 10 6.6 12 3Z"
        stroke={category.accentColor}
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M12 8.2v6.9m-3.4-3.5h6.8"
        stroke={category.accentColor}
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function IntentionGlyph({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 32 32">
      <path
        d="M16 4c1.5 5 4.5 8 9 9.8-4.5 1.8-7.5 4.9-9 10.2-1.5-5.3-4.5-8.4-9-10.2C11.5 12 14.5 9 16 4Z"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function Logo({ isScrolled }: { isScrolled: boolean }) {
  return (
    <NavLink
      aria-label="Auralith inicio"
      className="group flex flex-col items-start leading-none"
      to="/"
    >
      <motion.span
        className="font-display text-2xl text-ink md:text-[28px]"
        style={{ letterSpacing: '0.1em' }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ letterSpacing: '0.15em' }}
      >
        AURALITH
      </motion.span>
      <AnimatePresence>
        {!isScrolled ? (
          <motion.span
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            className="mt-1 font-body text-[10px] font-medium uppercase tracking-[0.28em] text-gold"
            exit={{ height: 0, opacity: 0, y: -4 }}
            initial={{ height: 0, opacity: 0, y: -4 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            Tienda Holística
          </motion.span>
        ) : null}
      </AnimatePresence>
    </NavLink>
  )
}

function DesktopNav({
  activeMega,
  setActiveMega,
}: {
  activeMega: MegaMenuType | null
  setActiveMega: (value: MegaMenuType | null) => void
}) {
  const location = useLocation()

  return (
    <nav
      aria-label="Navegacion principal"
      className="hidden items-center gap-7 lg:flex"
    >
      {navItems.map((item) => (
        <div
          className="relative"
          key={item.label}
          onMouseEnter={() => setActiveMega(item.mega ?? null)}
        >
          <NavLink
            className={() =>
              cn(
                'group relative block py-2 font-body text-[13px] font-medium text-ink-soft transition-colors duration-300 hover:text-ink',
                isNavItemActive(item, location) && 'text-ink',
              )
            }
            onFocus={() => setActiveMega(item.mega ?? null)}
            to={item.to}
          >
            {() => (
              <>
                {item.label}
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-0.5 w-0 bg-gold transition-all duration-300 ease-auralith group-hover:w-full',
                    isNavItemActive(item, location) &&
                      'w-full bg-sage group-hover:bg-sage',
                    activeMega === item.mega && item.mega && 'w-full',
                  )}
                />
              </>
            )}
          </NavLink>
        </div>
      ))}
    </nav>
  )
}

function MegaMenu({
  activeMega,
  onClose,
}: {
  activeMega: MegaMenuType | null
  onClose: () => void
}) {
  const featuredProduct = products.find((product) => product.featured) ?? products[0]
  const featuredProductImage = featuredProduct
    ? getHeaderProductImage(featuredProduct)
    : ''

  return (
    <AnimatePresence>
      {activeMega ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 top-full hidden border-b border-gold/20 bg-cream shadow-soft lg:block"
          exit={{ opacity: 0, y: -12 }}
          initial={{ opacity: 0, y: -12 }}
          onMouseEnter={() => undefined}
          onMouseLeave={onClose}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-[1fr_280px] gap-8 px-8 py-7">
            {activeMega === 'intentions' ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {intentions.map((intention) => (
                    <NavLink
                      className="group rounded-xl border border-gold/15 bg-cream-light/70 p-4 transition-colors duration-300 hover:border-gold/60 hover:bg-sage/10"
                      key={intention.id}
                      onClick={onClose}
                      to={`/tienda?intencion=${intention.slug}`}
                    >
                      <div className="mb-3 text-gold">
                        <IntentionGlyph color={intention.color} />
                      </div>
                      <p className="font-display text-lg leading-tight text-ink">
                        {intention.name}
                      </p>
                      <p className="mt-2 line-clamp-2 font-body text-xs leading-relaxed text-ink-muted">
                        {intention.affirmation}
                      </p>
                    </NavLink>
                  ))}
                </div>
                {featuredProduct ? (
                  <div className="rounded-xl border border-gold/20 bg-cream-light p-4">
                    <p className="mb-3 font-body text-[10px] font-semibold uppercase tracking-widest text-sage-dark">
                      Producto de la semana
                    </p>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-cream-dark">
                      {featuredProductImage ? (
                        <img
                          alt={featuredProduct.images[0]?.alt ?? featuredProduct.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={featuredProductImage}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center">
                          <span className="font-display text-4xl text-gold/45">
                            A
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 font-display text-xl leading-tight">
                      {featuredProduct.name}
                    </h3>
                    <p className="mt-1 font-body text-sm font-semibold text-gold">
                      {currencyFormatter.format(featuredProduct.price)}
                    </p>
                    <NavLink
                      className="auralith-shimmer relative mt-4 flex h-9 w-full items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-4 font-body text-xs font-medium text-ink shadow-gold transition-colors hover:bg-gold-light"
                      onClick={onClose}
                      to={`/producto/${featuredProduct.slug}`}
                    >
                      <span className="relative z-10">Ver ritual</span>
                    </NavLink>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gold/20 bg-cream-light p-5">
                    <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-sage-dark">
                      Catalogo en preparacion
                    </p>
                    <p className="mt-4 font-display text-2xl leading-tight text-ink">
                      Agrega productos desde el admin para destacarlos aqui.
                    </p>
                    <NavLink
                      className="auralith-shimmer relative mt-5 flex h-9 w-full items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-4 font-body text-xs font-medium text-ink shadow-gold transition-colors hover:bg-gold-light"
                      onClick={onClose}
                      to="/tienda"
                    >
                      <span className="relative z-10">Ir a tienda</span>
                    </NavLink>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <NavLink
                      className="group flex items-center justify-between rounded-xl border border-transparent p-4 transition-colors duration-300 hover:border-sage/30 hover:bg-sage/10"
                      key={category.id}
                      onClick={onClose}
                      to={`/tienda?categoria=${category.slug}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-cream-light ring-1 ring-gold/20">
                          <CategoryGlyph category={category} />
                        </span>
                        <span>
                          <span className="block font-display text-lg leading-tight text-ink">
                            {category.name}
                          </span>
                          <span className="font-body text-xs text-ink-muted">
                            {category.productCount} productos
                          </span>
                        </span>
                      </span>
                      <ArrowIcon className="translate-x-[-6px] text-gold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                    </NavLink>
                  ))}
                </div>
                <div className="rounded-xl border border-gold/20 bg-cream-light p-5">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-sage-dark">
                    Curaduria Auralith
                  </p>
                  <p className="mt-4 font-display text-2xl leading-tight text-ink">
                    Elige por energia, material o momento de uso.
                  </p>
                  <p className="mt-3 font-body text-sm font-light leading-relaxed text-ink-muted">
                    Las categorias estan pensadas para comprar por ritual, hogar
                    y cuidado personal.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function SearchOverlay({
  onClose,
  open,
}: {
  onClose: () => void
  open: boolean
}) {
  useCatalogStore((state) => state.version)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const results = (() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return products.slice(0, 4)
    }

    return products
      .filter((product) =>
        [product.name, product.subtitle, product.shortDescription, ...product.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .slice(0, 6)
  })()

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-modal bg-cream/98 px-5 py-24 backdrop-blur-md"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Buscar productos"
        >
          <button
            aria-label="Cerrar busqueda"
            className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full border border-gold/30 text-gold transition-colors hover:bg-gold/10"
            onClick={onClose}
            type="button"
          >
            <span className="text-2xl leading-none">x</span>
          </button>
          <div className="mx-auto flex max-w-3xl flex-col items-center">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark"
              initial={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.28 }}
            >
              Buscar en Auralith
            </motion.p>
            <motion.input
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 w-full border-b border-gold/40 bg-transparent pb-4 text-center font-display text-4xl text-ink outline-none placeholder:text-ink-muted/40 md:text-6xl"
              initial={{ opacity: 0, y: 16 }}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cristales, rituales..."
              ref={inputRef}
              transition={{ delay: 0.08, duration: 0.32 }}
              value={query}
            />
            <motion.div
              animate="visible"
              className="mt-10 grid w-full gap-3"
              initial="hidden"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
            >
              {results.map((product) => {
                const productImage = getHeaderProductImage(product)

                return (
                  <MotionLink
                    className="flex items-center gap-4 rounded-xl border border-gold/15 bg-cream-light/70 p-3 transition-colors hover:bg-sage/10"
                    key={product.id}
                    onClick={onClose}
                    to={`/producto/${product.slug}`}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: { opacity: 1, y: 0 },
                    }}
                  >
                    <span className="h-16 w-16 overflow-hidden rounded-lg bg-cream-dark">
                      {productImage ? (
                        <img
                          alt={product.images[0]?.alt ?? product.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={productImage}
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center font-display text-2xl text-gold/45">
                          A
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg text-ink">
                        {product.name}
                      </span>
                      <span className="block truncate font-body text-xs text-ink-muted">
                        {product.shortDescription}
                      </span>
                    </span>
                    <span className="font-body text-sm font-semibold text-gold">
                      {currencyFormatter.format(product.price)}
                    </span>
                  </MotionLink>
                )
              })}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/20 bg-cream-light/50 text-ink transition-colors duration-300 hover:bg-gold/10"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function MobileMenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 36 36">
      <motion.path
        animate={{ d: open ? 'M10 11L26 25' : 'M8 11H28' }}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <motion.path
        animate={{ opacity: open ? 0 : 1 }}
        d="M8 18H28"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <motion.path
        animate={{ d: open ? 'M26 11L10 25' : 'M8 25H28' }}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MobileMenu({
  onClose,
  open,
}: {
  onClose: () => void
  open: boolean
}) {
  const location = useLocation()
  const siteContent = useCatalogStore((state) => state.content)
  const socialLinks = [
    {
      href: createInstagramUrl(siteContent?.instagramHandle),
      label: 'Instagram',
    },
    { href: 'https://tiktok.com', label: 'TikTok' },
    {
      href: createWhatsAppUrl(siteContent?.whatsappNumber),
      label: 'WhatsApp',
    },
  ]

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ x: 0 }}
          className="auralith-grain fixed inset-0 z-overlay bg-cream px-7 pb-8 pt-28 lg:hidden"
          exit={{ x: '100%' }}
          initial={{ x: '100%' }}
          transition={{ damping: 30, stiffness: 300, type: 'spring' }}
        >
          <motion.nav
            animate="visible"
            className="flex flex-col gap-5"
            initial="hidden"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {navItems.map((item) => (
              <motion.div
                key={item.label}
                variants={{
                  hidden: { opacity: 0, x: 44 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <NavLink
                  className={cn(
                    'block border-b border-gold/20 pb-4 font-display text-3xl text-ink transition-colors',
                    isNavItemActive(item, location) && 'text-gold',
                  )}
                  onClick={onClose}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </motion.div>
            ))}
          </motion.nav>
          <div className="absolute inset-x-7 bottom-8 border-t border-gold/20 pt-6">
            <p className="font-body text-xs uppercase tracking-widest text-sage-dark">
              Contacto
            </p>
            <a
              className="mt-3 block font-display text-2xl text-ink"
              href={createTelUrl(siteContent?.whatsappNumber)}
            >
              {formatPhoneLabel(siteContent?.whatsappNumber)}
            </a>
            {siteContent?.schedule ? (
              <p className="mt-1 block font-body text-sm text-ink-muted">
                {siteContent.schedule}
              </p>
            ) : null}
            <a
              className="mt-1 block font-body text-sm text-ink-muted"
              href="mailto:hola@auralith.pe"
            >
              hola@auralith.pe
            </a>
            <div className="mt-5 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  className="rounded-full border border-gold/30 px-4 py-2 font-body text-xs uppercase tracking-widest text-ink"
                  href={social.href}
                  key={social.label}
                  rel="noreferrer"
                  target="_blank"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/**
 * Scroll-reactive Auralith header with desktop mega menus, search overlay,
 * WhatsApp shortcut, Zustand cart badge/drawer and animated mobile menu.
 */
export function Header() {
  useCatalogStore((state) => state.version)
  const siteContent = useCatalogStore((state) => state.content)
  const [activeMega, setActiveMega] = useState<MegaMenuType | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [badgePulseKey, setBadgePulseKey] = useState(0)
  const headerRef = useRef<HTMLElement>(null)
  const previousCount = useRef(0)
  const itemCount = useCartStore((state) => state.totals.itemCount)
  const toggleDrawer = useCartStore((state) => state.toggleDrawer)
  const { scrollY } = useScroll()
  const backgroundColor = useTransform(
    scrollY,
    [0, 80],
    ['rgba(245, 241, 232, 0)', 'rgba(245, 241, 232, 0.95)'],
  )
  const borderColor = useTransform(
    scrollY,
    [0, 80],
    ['rgba(201, 168, 106, 0)', 'rgba(201, 168, 106, 0.2)'],
  )
  const logoScale = useTransform(scrollY, [0, 80], [1, 0.9])
  const paddingY = useTransform(scrollY, [0, 80], [24, 12])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 80)
  })

  useEffect(() => {
    if (itemCount > previousCount.current) {
      setBadgePulseKey((current) => current + 1)
    }

    previousCount.current = itemCount
  }, [itemCount])

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        activeMega &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setActiveMega(null)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [activeMega])

  const closeAllPanels = () => {
    setActiveMega(null)
    setIsMobileMenuOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      setActiveMega(null)
      setIsSearchOpen(false)
      toggleDrawer(false)
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      <motion.header
        className={cn(
          'fixed inset-x-0 top-0 z-header border-b',
          isMobileMenuOpen && 'z-[70]',
        )}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setActiveMega(null)
          }
        }}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setActiveMega(null)}
        ref={headerRef}
        style={{
          backdropFilter: isScrolled ? 'blur(12px)' : 'blur(0px)',
          backgroundColor,
          borderColor,
          transition: 'backdrop-filter 400ms ease',
        }}
      >
        <motion.div
          className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8"
          style={{ paddingBottom: paddingY, paddingTop: paddingY }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            style={{ scale: logoScale, transformOrigin: 'left center' }}
            transition={{ damping: 22, stiffness: 400, type: 'spring' }}
          >
            <Logo isScrolled={isScrolled} />
          </motion.div>

          <DesktopNav activeMega={activeMega} setActiveMega={setActiveMega} />

          <div className="flex items-center gap-2">
            <IconButton label="Buscar" onClick={() => setIsSearchOpen(true)}>
              <SearchIcon />
            </IconButton>
            <a
              aria-label="Consultar por WhatsApp"
              className="group relative grid h-10 w-10 place-items-center rounded-full border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] transition-colors hover:bg-[#25D366]/20"
              href={createWhatsAppUrl(siteContent?.whatsappNumber)}
              rel="noreferrer"
              target="_blank"
            >
              <WhatsAppIcon />
              <span className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] rounded-full bg-ink px-3 py-1 font-body text-[11px] text-cream-light opacity-0 shadow-soft transition-opacity duration-200 group-hover:opacity-100">
                Consultar
              </span>
            </a>
            <button
              aria-label="Abrir carrito"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-gold/20 bg-cream-light/50 text-ink transition-colors duration-300 hover:bg-gold/10"
              data-cart-target
              onClick={() => toggleDrawer(true)}
              type="button"
            >
              <CartIcon />
              <AnimatePresence>
                {itemCount > 0 ? (
                  <motion.span
                    animate={{
                      scale: [1, 1.28, 1],
                      y: badgePulseKey ? [0, -4, 0] : 0,
                    }}
                    className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 font-body text-[10px] font-semibold text-ink"
                    exit={{ opacity: 0, scale: 0 }}
                    initial={{ opacity: 0, scale: 0 }}
                    key={`${itemCount}-${badgePulseKey}`}
                    transition={{ damping: 14, stiffness: 420, type: 'spring' }}
                  >
                    {itemCount}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </button>
            <button
              aria-label={isMobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
              className="relative z-[61] grid h-10 w-10 place-items-center rounded-full border border-gold/20 bg-cream-light/70 text-ink lg:hidden"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              type="button"
            >
              <MobileMenuIcon open={isMobileMenuOpen} />
            </button>
          </div>
        </motion.div>

        <MegaMenu activeMega={activeMega} onClose={() => setActiveMega(null)} />
      </motion.header>

      <SearchOverlay onClose={() => setIsSearchOpen(false)} open={isSearchOpen} />
      <MobileMenu onClose={closeAllPanels} open={isMobileMenuOpen} />
      <CartDrawer />
    </>
  )
}
