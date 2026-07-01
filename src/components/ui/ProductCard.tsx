import { motion } from 'framer-motion'
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Link } from 'react-router-dom'
import { cardHover } from '../../styles/animations'
import { Badge } from './Badge'
import { Button } from './Button'
import { cn } from './utils'

export type ProductCardImage = {
  alt: string
  src: string
}

export type ProductCardItem = {
  compareAtPrice?: number | null
  currency?: string
  id: string
  image?: string
  imageAlt?: string
  images?: ProductCardImage[]
  intentionLabel?: string
  name: string
  price: number
  slug?: string
  status?: string
  stock?: number
}

export type ProductCardProps = {
  addLabel?: string
  cartTargetSelector?: string
  className?: string
  currencyFormatter?: Intl.NumberFormat
  intentionLabel?: string
  onAdd?: (product: ProductCardItem) => void
  onQuickView?: (product: ProductCardItem) => void
  product: ProductCardItem
}

type ParticleStyle = CSSProperties & {
  '--particle-delay': string
  '--particle-x': string
  '--particle-y': string
}

const particleVectors = [
  [-22, -42],
  [28, -36],
  [-38, -12],
  [40, 6],
  [-18, 34],
  [24, 38],
] as const

function getProductImage(product: ProductCardItem): ProductCardImage {
  const primaryImage = product.images?.[0]

  return {
    alt: primaryImage?.alt ?? product.imageAlt ?? product.name,
    src: primaryImage?.src ?? product.image ?? '',
  }
}

function ProductImageEmptyState() {
  return (
    <div className="grid h-full w-full place-items-center bg-cream-dark">
      <div className="text-center">
        <span className="font-display text-4xl text-gold/45">A</span>
        <p className="mt-2 font-body text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
          Sin foto
        </p>
      </div>
    </div>
  )
}

function animateFlyingImage(
  image: HTMLImageElement | null,
  cartTargetSelector: string,
) {
  if (!image || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const start = image.getBoundingClientRect()
  const target = document.querySelector<HTMLElement>(cartTargetSelector)
  const targetRect = target?.getBoundingClientRect()
  const endX = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth - 56
  const endY = targetRect ? targetRect.top + targetRect.height / 2 : 44
  const startX = start.left + start.width / 2
  const startY = start.top + start.height / 2
  const midX = (endX - startX) * 0.45
  const midY = Math.min(endY - startY - 120, -80)
  const clone = image.cloneNode(true) as HTMLImageElement

  clone.className = 'auralith-flying-image'
  clone.style.height = `${start.height}px`
  clone.style.left = `${start.left}px`
  clone.style.top = `${start.top}px`
  clone.style.width = `${start.width}px`
  document.body.appendChild(clone)

  const animation = clone.animate(
    [
      { opacity: 0.92, transform: 'translate3d(0, 0, 0) scale(1)' },
      {
        opacity: 0.82,
        transform: `translate3d(${midX}px, ${midY}px, 0) scale(0.64)`,
      },
      {
        opacity: 0,
        transform: `translate3d(${endX - startX}px, ${endY - startY}px, 0) scale(0.18)`,
      },
    ],
    {
      duration: 760,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  )

  animation.oncancel = () => clone.remove()
  animation.onfinish = () => clone.remove()
}

/**
 * Premium product card with hover image zoom, image overlay, sliding add action,
 * golden particle burst and a flying-to-cart microinteraction.
 */
export function ProductCard({
  addLabel = 'Agregar',
  cartTargetSelector = '[data-cart-target]',
  className,
  currencyFormatter = new Intl.NumberFormat('es-PE', {
    currency: 'PEN',
    style: 'currency',
  }),
  intentionLabel,
  onAdd,
  onQuickView,
  product,
}: ProductCardProps) {
  const [burstId, setBurstId] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)
  const image = useMemo(() => getProductImage(product), [product])
  const badgeLabel = intentionLabel ?? product.intentionLabel ?? 'Intencion'
  const productPath = product.slug ? `/producto/${product.slug}` : null
  const isSoldOut = product.status === 'sold-out' || product.stock === 0
  const isLowStock =
    !isSoldOut &&
    (product.status === 'low-stock' ||
      (typeof product.stock === 'number' && product.stock <= 5))

  const handleAdd = useCallback(() => {
    if (isSoldOut) {
      return
    }

    setBurstId((current) => current + 1)
    animateFlyingImage(imageRef.current, cartTargetSelector)
    onAdd?.(product)
  }, [cartTargetSelector, isSoldOut, onAdd, product])

  return (
    <motion.article
      className={cn('group relative min-w-0 rounded-xl bg-cream-light', className)}
      initial="rest"
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      variants={cardHover}
      whileHover="hover"
    >
      <div className="relative aspect-[1/1.14] overflow-hidden rounded-xl bg-cream sm:aspect-square">
        {image.src && productPath ? (
          <Link aria-label={`Ver ${product.name}`} to={productPath}>
            <img
              alt={image.alt}
              className="h-full w-full object-cover transition-transform duration-500 ease-auralith group-hover:scale-[1.06]"
              loading="lazy"
              ref={imageRef}
              src={image.src}
            />
          </Link>
        ) : image.src ? (
          <img
            alt={image.alt}
            className="h-full w-full object-cover transition-transform duration-500 ease-auralith group-hover:scale-[1.06]"
            loading="lazy"
            ref={imageRef}
            src={image.src}
          />
        ) : productPath ? (
          <Link aria-label={`Ver ${product.name}`} to={productPath}>
            <ProductImageEmptyState />
          </Link>
        ) : (
          <ProductImageEmptyState />
        )}
        <div className="absolute inset-0 bg-ink/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {isSoldOut || isLowStock ? (
          <div className="absolute left-3 top-3 z-10">
            <Badge variant={isSoldOut ? 'soldOut' : 'lowStock'}>
              {isSoldOut ? 'Stock agotado' : 'Stock bajo'}
            </Badge>
          </div>
        ) : null}
        <div className="absolute inset-x-3 bottom-3 translate-y-[calc(100%+1rem)] opacity-0 transition-all duration-300 ease-auralith group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            className="w-full"
            disabled={isSoldOut}
            onClick={handleAdd}
            size="sm"
            variant="primary"
          >
            {isSoldOut ? 'Agotado' : addLabel}
          </Button>
        </div>
        {burstId > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2"
            key={burstId}
          >
            {particleVectors.map(([x, y], index) => (
              <span
                className="auralith-gold-particle"
                key={`${burstId}-${x}-${y}`}
                style={
                  {
                    '--particle-delay': `${index * 24}ms`,
                    '--particle-x': `${x}px`,
                    '--particle-y': `${y}px`,
                  } as ParticleStyle
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 px-0.5 pt-3 sm:space-y-3 sm:px-1 sm:pt-4">
        <Badge className="max-w-full px-2 py-1 text-[9px] sm:px-3 sm:text-[11px]" variant="intention">
          <span className="truncate">{badgeLabel}</span>
        </Badge>
        <div className="space-y-1">
          {productPath ? (
            <Link to={productPath}>
              <h3 className="line-clamp-2 font-display text-[14px] leading-snug text-ink transition-colors hover:text-gold-dark sm:text-[15px]">
                {product.name}
              </h3>
            </Link>
          ) : (
            <h3 className="line-clamp-2 font-display text-[14px] leading-snug text-ink transition-colors hover:text-gold-dark sm:text-[15px]">
              {product.name}
            </h3>
          )}
          <div className="flex items-baseline gap-2">
            <p className="font-body text-[13px] font-semibold text-gold sm:text-sm">
              {currencyFormatter.format(product.price)}
            </p>
            {product.compareAtPrice ? (
              <p className="font-body text-xs text-ink-muted line-through">
                {currencyFormatter.format(product.compareAtPrice)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="min-w-0 flex-1 px-2 sm:px-4"
            disabled={isSoldOut}
            onClick={handleAdd}
            size="sm"
          >
            {isSoldOut ? 'Agotado' : addLabel}
          </Button>
          {onQuickView ? (
            <Button
              aria-label={`Ver ${product.name}`}
              onClick={() => onQuickView(product)}
              size="sm"
              variant="ghost"
            >
              Ver
            </Button>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}
