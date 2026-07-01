import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { Accordion } from '../components/ui/Accordion'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ProductCard, type ProductCardItem } from '../components/ui/ProductCard'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { SectionTitle } from '../components/ui/SectionTitle'
import { cn } from '../components/ui/utils'
import { categories, intentions, products, type Product } from '../data'
import { createWhatsAppUrl } from '../lib/contact'
import { useCartStore, useCatalogStore } from '../store'

type GalleryImage = {
  alt: string
  src: string
}

type AddState = 'added' | 'idle' | 'adding'

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function DiscountBadge({ product }: { product: Product }) {
  if (!product.compareAtPrice) {
    return null
  }

  const discount = Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100,
  )

  return (
    <motion.span
      animate={{ opacity: 1, scale: [0.72, 1.12, 1] }}
      className="rounded-full bg-gold px-3 py-1 font-body text-xs font-semibold text-ink"
      initial={{ opacity: 0, scale: 0.72 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      -{discount}%
    </motion.span>
  )
}

function StockIndicator({ product }: { product: Product }) {
  const state =
    product.status === 'sold-out' || product.stock <= 0
      ? {
          className: 'bg-red-500',
          label: 'Agotado',
          text: 'No disponible por ahora',
        }
      : product.status === 'low-stock'
        ? {
            className: 'bg-amber-500',
            label: 'Últimas unidades',
            text: `${product.stock} disponibles`,
          }
        : {
            className: 'bg-sage-dark',
            label: 'Disponible',
            text: `${product.stock} disponibles`,
          }

  return (
    <div className="flex items-center gap-3 font-body text-sm text-ink-muted">
      <span className="relative flex h-3 w-3">
        <span
          className={cn(
            'auralith-stock-pulse absolute inline-flex h-full w-full rounded-full opacity-75',
            state.className,
          )}
        />
        <span className={cn('relative inline-flex h-3 w-3 rounded-full', state.className)} />
      </span>
      <span>
        <span className="font-medium text-ink">{state.label}</span> · {state.text}
      </span>
    </div>
  )
}

function IntentIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 3c1 3.1 3 5 6 6-3 1-5 3-6 6-1-3-3-5-6-6 3-1 5-2.9 6-6Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M5.5 6.5h12l-1.2 7a2 2 0 0 1-2 1.7H7.8a2 2 0 0 1-2-1.6L4.5 3.5H2.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 32 32">
      <path d="M16.02 4C9.4 4 4.02 9.28 4.02 15.78c0 2.08.56 4.11 1.62 5.9L4 28l6.49-1.66a12.2 12.2 0 0 0 5.53 1.34C22.6 27.68 28 22.4 28 15.9 28 9.39 22.6 4 16.02 4Zm0 21.66c-1.78 0-3.52-.47-5.04-1.37l-.36-.21-3.86.99 1.03-3.67-.24-.38a9.69 9.69 0 0 1-1.5-5.24c0-5.39 4.47-9.77 9.97-9.77 5.5 0 9.97 4.44 9.97 9.89 0 5.37-4.47 9.76-9.97 9.76Zm5.46-7.3c-.3-.15-1.77-.86-2.04-.95-.27-.1-.47-.15-.67.14-.2.3-.77.95-.94 1.14-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.46-.89-.78-1.49-1.74-1.66-2.03-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.58-.92-2.16-.24-.56-.49-.48-.67-.49h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1-1.04 2.42 0 1.43 1.07 2.8 1.22 3 .15.2 2.1 3.13 5.1 4.38.71.3 1.27.48 1.7.62.72.22 1.37.19 1.89.12.58-.08 1.77-.72 2.02-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.34Z" />
    </svg>
  )
}

function WordReveal({ text }: { text: string }) {
  return (
    <h1 className="font-display text-4xl leading-tight text-ink md:text-5xl">
      {text.split(' ').map((word, index) => (
        <span className="inline-block overflow-hidden pr-2" key={`${word}-${index}`}>
          <motion.span
            animate={{ y: 0 }}
            className="inline-block"
            initial={{ y: '110%' }}
            transition={{
              delay: index * 0.055,
              duration: 0.56,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {index < text.split(' ').length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

function buildGallery(product: Product): GalleryImage[] {
  return product.images
    .filter((image) => Boolean(image.src))
    .map((image, index) => ({
      alt: image.alt || `${product.name} ${index + 1}`,
      src: image.src,
    }))
}

function getProductImageSrc(product: Product) {
  return product.images.find((image) => Boolean(image.src))?.src ?? ''
}

function mapProductToCard(product: Product): ProductCardItem {
  const productImages = product.images
    .filter((image) => Boolean(image.src))
    .map((image) => ({
      alt: image.alt || product.name,
      src: image.src,
    }))

  return {
    compareAtPrice: product.compareAtPrice,
    id: product.id,
    images: productImages,
    intentionLabel:
      intentions.find((intention) => product.intentionIds.includes(intention.id))
        ?.name ?? 'Ritual',
    name: product.name,
    price: product.price,
    slug: product.slug,
    status: product.status,
    stock: product.stock,
  }
}

function mapProductToCart(product: Product) {
  return {
    categoryId: product.categoryId,
    id: product.id,
    image: getProductImageSrc(product),
    intention:
      intentions.find((intention) => product.intentionIds.includes(intention.id))
        ?.name ?? 'Ritual',
    name: product.name,
    price: product.price,
    sku: product.sku,
    slug: product.slug,
  }
}

function Gallery({
  gallery,
  product,
}: {
  gallery: GalleryImage[]
  product: Product
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const rotateX = useSpring(useMotionValue(0), { damping: 18, stiffness: 170 })
  const rotateY = useSpring(useMotionValue(0), { damping: 18, stiffness: 170 })
  const activeImage = gallery[activeIndex]
  const isSoldOut = product.status === 'sold-out'

  useEffect(() => {
    if (activeIndex >= gallery.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, gallery.length])

  useEffect(() => {
    if (!zoomOpen || !activeImage) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setZoomOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [zoomOpen])

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    rotateX.set(clamp(-y * 16, -8, 8))
    rotateY.set(clamp(x * 16, -8, 8))
  }

  return (
    <div className="space-y-4">
      <motion.div
        className={cn(
          'relative aspect-square overflow-hidden rounded-2xl bg-cream-dark shadow-soft',
          activeImage && 'cursor-zoom-in',
        )}
        onClick={() => {
          if (activeImage) {
            setZoomOpen(true)
          }
        }}
        onMouseLeave={() => {
          rotateX.set(0)
          rotateY.set(0)
        }}
        onMouseMove={handleMouseMove}
        style={{
          rotateX,
          rotateY,
          transformPerspective: 800,
          transformStyle: 'preserve-3d',
        }}
      >
        <AnimatePresence mode="wait">
          {activeImage ? (
            <motion.img
              alt={activeImage.alt}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full w-full object-cover"
              exit={{ opacity: 0, scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.95 }}
              key={activeImage.src}
              src={activeImage.src}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <motion.div
              animate={{ opacity: 1 }}
              className="grid h-full w-full place-items-center bg-cream-dark"
              initial={{ opacity: 0 }}
              key="no-product-image"
            >
              <div className="text-center">
                <span className="font-display text-5xl text-gold/45">A</span>
                <p className="mt-3 font-body text-xs uppercase tracking-widest text-ink-muted">
                  Sin foto cargada
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute left-5 top-5 flex gap-2">
          {product.isNew ? <Badge variant="new">Nuevo</Badge> : null}
          {product.compareAtPrice ? <Badge variant="offer">Oferta</Badge> : null}
          {product.stock <= 0 || product.status === 'sold-out' ? (
            <Badge variant="soldOut">Stock agotado</Badge>
          ) : product.status === 'low-stock' || product.stock <= 5 ? (
            <Badge variant="lowStock">Stock bajo</Badge>
          ) : null}
        </div>
        {isSoldOut ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/50">
            <span className="font-display text-4xl text-cream-light">Agotado</span>
          </div>
        ) : null}
      </motion.div>

      {gallery.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {gallery.map((image, index) => (
            <button
              aria-label={`Ver imagen ${index + 1}`}
              className={cn(
                'h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-cream-dark transition-transform',
                activeIndex === index
                  ? 'scale-105 border-2 border-gold'
                  : 'border-gold/20',
              )}
              key={image.src}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img alt={image.alt} className="h-full w-full object-cover" src={image.src} />
            </button>
          ))}
        </div>
      ) : null}

      <AnimatePresence>
        {zoomOpen && activeImage ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-modal grid place-items-center bg-cream/85 p-5 backdrop-blur-xl"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Imagen ampliada"
          >
            <button
              aria-label="Cerrar imagen ampliada"
              className="absolute inset-0"
              onClick={() => setZoomOpen(false)}
              type="button"
            />
            <motion.img
              alt={activeImage.alt}
              animate={{ scale: 1 }}
              className="relative z-10 max-h-[86vh] max-w-[92vw] rounded-2xl object-contain shadow-lifted"
              exit={{ scale: 0.8 }}
              initial={{ scale: 0.8 }}
              src={activeImage.src}
              transition={{ damping: 24, stiffness: 320, type: 'spring' }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function AddToCartButton({
  disabled,
  onAdd,
}: {
  disabled: boolean
  onAdd: () => void
}) {
  const [state, setState] = useState<AddState>('idle')

  const handleClick = () => {
    if (disabled || state !== 'idle') {
      return
    }

    setState('adding')
    window.setTimeout(() => {
      onAdd()
      setState('added')
    }, 180)
    window.setTimeout(() => setState('idle'), 1200)
  }

  return (
    <motion.button
      className="auralith-shimmer relative flex h-12 w-full items-center justify-center overflow-hidden rounded-full bg-gold px-6 font-body text-sm font-semibold text-ink shadow-gold disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onClick={handleClick}
      type="button"
      whileTap={{ scale: 0.96 }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 inline-flex items-center gap-2"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: 10 }}
          key={state}
        >
          {state === 'added' ? (
            <>
              <CartIcon />
              ¡Agregado!
            </>
          ) : state === 'adding' ? (
            <>
              <CartIcon />
              Agregando...
            </>
          ) : (
            'Agregar al carrito'
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

function InfoPanel({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const category = categories.find((item) => item.id === product.categoryId)
  const primaryIntention = intentions.find((intention) =>
    product.intentionIds.includes(intention.id),
  )
  const productIntentions = intentions.filter((intention) =>
    product.intentionIds.includes(intention.id),
  )
  const addItem = useCartStore((state) => state.addItem)
  const siteContent = useCatalogStore((state) => state.content)
  const isSoldOut = product.status === 'sold-out' || product.stock <= 0
  const ritualSummary = ''
  const energeticProperties = ''
  const addToCart = () => {
    if (isSoldOut) {
      return
    }

    addItem(mapProductToCart(product), quantity)
  }

  return (
    <aside className="sticky top-28 space-y-6">
      <div className="font-body text-xs uppercase tracking-widest text-ink-muted">
        <Link className="hover:text-gold-dark" to="/">
          Inicio
        </Link>{' '}
        /{' '}
        <Link className="hover:text-gold-dark" to="/tienda">
          Tienda
        </Link>{' '}
        / {category?.shortName ?? 'Producto'}
      </div>

      {primaryIntention ? (
        <Badge className="gap-2 normal-case tracking-normal" variant="intention">
          <IntentIcon />
          {primaryIntention.name}
        </Badge>
      ) : null}

      <WordReveal text={product.name} />

      <div className="flex flex-wrap items-center gap-3">
        {product.compareAtPrice ? (
          <span className="font-body text-lg text-ink-muted line-through">
            {currencyFormatter.format(product.compareAtPrice)}
          </span>
        ) : null}
        <span className="font-body text-[28px] font-bold leading-none text-gold">
          {currencyFormatter.format(product.price)}
        </span>
        <DiscountBadge product={product} />
      </div>

      <StockIndicator product={product} />

      <p className="font-body text-[15px] font-light leading-[1.8] text-ink-muted">
        {product.shortDescription}
      </p>

      <Accordion
        defaultOpenIds={['description']}
        items={[
          {
            answer: product.description,
            id: 'description',
            question: 'Descripción completa',
          },
          {
            answer: (
              <div className="space-y-2">
                <p>{ritualSummary}</p>
                <p>
                  Propiedades: {energeticProperties}.
                </p>
              </div>
            ),
            id: 'energy',
            question: 'Recomendación energética',
          },
        ].slice(0, 1)}
      />

      <div className="space-y-3 rounded-2xl border border-gold/20 bg-cream-light p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-body text-sm text-ink-muted">Cantidad</span>
          <QuantityStepper
            disabled={isSoldOut}
            min={1}
            onChange={setQuantity}
            value={quantity}
          />
        </div>
        <AddToCartButton disabled={isSoldOut} onAdd={addToCart} />
        <Button
          className="w-full text-white hover:scale-[1.01]"
          icon={<WhatsAppIcon />}
          onClick={() =>
            window.open(
              createWhatsAppUrl(
                siteContent?.whatsappNumber,
                `Hola Auralith, quiero consultar por ${product.name}.`,
              ),
              '_blank',
              'noopener,noreferrer',
            )
          }
          size="lg"
          variant="whatsapp"
        >
          Consultar por WhatsApp
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {productIntentions.map((intention) => (
          <Link
            className="rounded-full border border-gold/25 bg-cream-light px-4 py-2 font-body text-xs uppercase tracking-widest text-sage-dark transition-colors hover:bg-sage/10"
            key={intention.id}
            to={`/tienda?intencion=${intention.slug}`}
          >
            {intention.name}
          </Link>
        ))}
      </div>
    </aside>
  )
}

function RelatedProducts({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const relatedMatches = products.filter(
    (item) =>
      item.id !== product.id &&
      (item.categoryId === product.categoryId ||
        item.intentionIds.some((id) => product.intentionIds.includes(id))),
  )
  const relatedFallbacks = products.filter(
    (item) =>
      item.id !== product.id &&
      !relatedMatches.some((relatedItem) => relatedItem.id === item.id),
  )
  const related = [...relatedMatches, ...relatedFallbacks].slice(0, 4)

  const handleRelatedAdd = (cardProduct: ProductCardItem) => {
    const sourceProduct = products.find((item) => item.id === cardProduct.id)

    if (sourceProduct) {
      addItem(mapProductToCart(sourceProduct))
    }
  }

  return (
    <section className="border-t border-gold/15 bg-cream-light px-5 py-20 md:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Curaduría relacionada"
          subtitle="Piezas que acompañan una intención, materialidad o ritual similar."
          title="También te puede interesar"
        />
        <div className="mt-4">
          <div className="mx-auto h-px max-w-2xl bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        </div>
        <div className="mt-12 flex snap-x gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible">
          {related.map((item, index) => (
            <motion.div
              className="min-w-[78vw] snap-center md:min-w-0"
              initial={{ opacity: 0, y: 30 }}
              key={item.id}
              transition={{
                delay: index * 0.08,
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
              viewport={{ amount: 0.2, once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <ProductCard
                onAdd={handleRelatedAdd}
                product={mapProductToCard(item)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProductPage() {
  useCatalogStore((state) => state.version)
  const { slug } = useParams()
  const product = products.find((item) => item.slug === slug)
  const gallery = useMemo(() => (product ? buildGallery(product) : []), [product])

  if (!product) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream px-5 pt-28 text-center">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
            Producto no encontrado
          </p>
          <h1 className="mt-4 font-display text-4xl text-ink">
            No encontramos esta pieza
          </h1>
          <Link
            className="auralith-shimmer relative mt-8 inline-flex h-12 items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-7 font-body text-base font-medium text-ink shadow-gold transition-colors duration-300 hover:bg-gold-light"
            to="/tienda"
          >
            <span className="relative z-10">Volver a tienda</span>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-cream pt-28">
      <section className="px-5 py-10 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,55fr)_minmax(0,45fr)]">
          <Gallery gallery={gallery} product={product} />
          <InfoPanel product={product} />
        </div>
      </section>
      <RelatedProducts product={product} />
    </main>
  )
}
