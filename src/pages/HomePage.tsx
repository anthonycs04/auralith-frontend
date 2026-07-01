import { AnimatePresence, motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  categories,
  intentions,
  products,
  type Category,
  type Product,
} from '../data'
import { Link } from 'react-router-dom'
import { useCartStore, useCatalogStore } from '../store'
import { Accordion } from '../components/ui/Accordion'
import { Button } from '../components/ui/Button'
import { Divider } from '../components/ui/Divider'
import { IntentionCard } from '../components/ui/IntentionCard'
import { ProductCard, type ProductCardItem } from '../components/ui/ProductCard'
import { SectionTitle } from '../components/ui/SectionTitle'
import { cn } from '../components/ui/utils'

gsap.registerPlugin(ScrollTrigger)

type ProductTab = string

type ValueItem = {
  icon: ReactNode
  label: string
}

type StepItem = {
  description: string
  icon: ReactNode
  title: string
}

const fallbackProductTabs: { id: ProductTab; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'crystals-minerals', label: 'Cristales' },
  { id: 'sahumos-aromas', label: 'Inciensos' },
  { id: 'jewelry', label: 'Joyería' },
]

const intentionVisuals: Record<string, string> = {
  abundance:
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=700&q=80',
  'calm-sleep':
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=700&q=80',
  'clarity-focus':
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80',
  'energy-cleansing':
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=700&q=80',
  protection:
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=80',
  'self-love':
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=700&q=80',
}

const categoryVisuals: Record<string, string> = {
  'crystals-minerals':
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80',
  'energetic-jewelry':
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80',
  'holistic-care':
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80',
  'home-altar':
    'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80',
  'oracles-guides':
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=80',
  'ritual-kits':
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
  'sahumos-aromas':
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80',
}

const values: ValueItem[] = [
  { icon: <LeafIcon />, label: 'Curaduría consciente' },
  { icon: <SparkIcon />, label: 'Rituales guiados' },
  { icon: <MoonIcon />, label: 'Energía para cada intención' },
  { icon: <PackageIcon />, label: 'Envíos en Perú' },
]

const steps: StepItem[] = [
  {
    description: 'Elige el propósito que quieres acompañar.',
    icon: <SparkIcon />,
    title: 'Define tu intención',
  },
  {
    description: 'Explora productos curados por energía, uso y origen.',
    icon: <LeafIcon />,
    title: 'Encuentra tu pieza',
  },
  {
    description: 'Agrega al carrito y confirma cantidades.',
    icon: <BagIcon />,
    title: 'Arma tu pedido',
  },
  {
    description: 'Te asesoramos por WhatsApp antes de cerrar la compra.',
    icon: <ChatIcon />,
    title: 'Coordina detalles',
  },
  {
    description: 'Recibe tu pedido listo para ritualizar.',
    icon: <PackageIcon />,
    title: 'Recibe y activa',
  },
]

const testimonials = [
  {
    author: 'María Fernanda',
    quote:
      'El set de luna nueva llegó precioso. Se siente curado con muchísimo cuidado.',
  },
  {
    author: 'Camila R.',
    id: 'testimonial-camila-r',
    quote:
      'La bruma Munay cambió mi rutina de cierre del día. Suave, elegante y nada invasiva.',
  },
  {
    author: 'Valeria S.',
    id: 'testimonial-valeria-s',
    quote:
      'Compré por intención y fue facilísimo encontrar algo que realmente conectara conmigo.',
  },
]

const faqItems = [
  {
    answer:
      'Sí. Cada producto incluye una sugerencia de uso o ritual breve para que puedas integrarlo con claridad en tu rutina.',
    id: 'ritual-guide',
    question: '¿Los productos incluyen guía de uso?',
  },
  {
    answer:
      'Trabajamos con insumos seleccionados, lotes pequeños y proveedores locales siempre que es posible.',
    id: 'origin',
    question: '¿De dónde provienen los productos?',
  },
  {
    answer:
      'Sí. Puedes escribirnos por WhatsApp para elegir por intención, momento personal o tipo de práctica.',
    id: 'advice',
    question: '¿Puedo recibir asesoría antes de comprar?',
  },
  {
    answer:
      'Coordinamos envíos dentro de Perú. Los tiempos dependen de ciudad y disponibilidad del producto.',
    id: 'shipping',
    question: '¿Hacen envíos a provincia?',
  },
]

function LeafIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M19.5 4.5C11 4.5 5 9.2 5 16.1c0 2 1.5 3.4 3.5 3.4C15.5 19.5 19.5 12.5 19.5 4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M5 19.5c3.5-6 7.2-8.4 12.5-10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3c1.2 4.1 3.7 6.6 8 8-4.3 1.4-6.8 3.9-8 8-1.2-4.1-3.7-6.6-8-8 4.3-1.4 6.8-3.9 8-8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M17.5 17.8A8 8 0 0 1 10.2 4a7.9 7.9 0 1 0 7.3 13.8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="m4.5 8.5 7.5 4 7.5-4M12 12.5v8M4.5 8.5l7.5-4 7.5 4v8l-7.5 4-7.5-4v-8Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 8h10l1 11H6L7 8Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M9 8a3 3 0 1 1 6 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 17.5V6.8A2.8 2.8 0 0 1 7.8 4h8.4A2.8 2.8 0 0 1 19 6.8v5.4a2.8 2.8 0 0 1-2.8 2.8H9l-4 2.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function WaveDivider({
  className,
  fill = '#F5F1E8',
}: {
  className?: string
  fill?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn('block h-14 w-full', className)}
      preserveAspectRatio="none"
      viewBox="0 0 1440 96"
    >
      <path
        d="M0 58c130-28 252-36 366-24 136 14 237 62 386 54 136-8 210-58 356-72 102-10 218 4 332 34v46H0V58Z"
        fill={fill}
      />
      <path
        d="M0 58c130-28 252-36 366-24 136 14 237 62 386 54 136-8 210-58 356-72 102-10 218 4 332 34"
        fill="none"
        opacity="0.25"
        stroke="#C9A86A"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function HeroHeadline({ text }: { text: string }) {
  const words = text.split(' ')

  return (
    <h1 className="max-w-3xl font-display text-5xl leading-tight text-ink md:text-[64px]">
      {words.map((word, index) => (
        <span className="inline-block overflow-hidden pr-3" key={`${word}-${index}`}>
          <motion.span
            animate={{ y: 0 }}
            className="inline-block"
            initial={{ y: '110%' }}
            transition={{
              delay: index * 0.06,
              duration: 0.62,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
            {index < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

function mapProductToCard(product: Product): ProductCardItem {
  return {
    compareAtPrice: product.compareAtPrice,
    id: product.id,
    images: [
      {
        alt: product.images[0]?.alt ?? product.name,
        src: product.images[0]?.src ?? '',
      },
    ],
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

function CategoryCard({
  category,
  index,
  register,
}: {
  category: Category
  index: number
  register: (node: HTMLAnchorElement | null, index: number) => void
}) {
  const background = category.image || categoryVisuals[category.id]

  return (
    <Link
      className="category-card group relative min-h-[220px] min-w-[78vw] snap-start overflow-hidden rounded-xl border border-gold/15 bg-ink md:min-w-0"
      to={`/tienda?categoria=${category.slug}`}
      ref={(node) => register(node, index)}
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(34,34,34,0.08), rgba(34,34,34,0.68)), url(${background})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 bg-sage/0 transition-colors duration-300 group-hover:bg-sage/20" />
      <div className="absolute inset-x-5 bottom-5">
        <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-cream/70">
          {category.productCount} productos
        </p>
        <h3 className="mt-2 font-display text-2xl leading-tight text-cream-light">
          {category.name}
        </h3>
        <span className="mt-4 block h-0.5 w-0 bg-gold transition-all duration-300 group-hover:w-full" />
      </div>
    </Link>
  )
}

function HeroImage({
  mouseRef,
  parallaxRef,
}: {
  mouseRef: React.RefObject<HTMLDivElement | null>
  parallaxRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="relative"
      initial={{ opacity: 0, x: 80 }}
      ref={parallaxRef}
      transition={{ delay: 0.2, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-sage/20 shadow-lifted"
        ref={mouseRef}
      >
        <div className="aspect-[4/5] bg-[radial-gradient(circle_at_35%_18%,rgba(223,192,138,0.55),transparent_28%),linear-gradient(135deg,rgba(143,165,140,0.28),rgba(250,248,243,0.82)),url('https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1100&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/18 via-transparent to-cream/20" />
      </div>
      <div className="absolute -left-8 top-1/2 hidden -translate-y-1/2 items-center gap-3 md:flex">
        <span className="h-20 w-px bg-gold" />
        <motion.span
          animate={{ y: [0, -10, 0] }}
          className="font-display text-2xl text-gold"
          transition={{ duration: 3.8, ease: 'easeInOut', repeat: Infinity }}
        >
          ✦
        </motion.span>
      </div>
    </motion.div>
  )
}

export function HomePage() {
  const [activeTab, setActiveTab] = useState<ProductTab>('all')
  const addItem = useCartStore((state) => state.addItem)
  const catalogVersion = useCatalogStore((state) => state.version)
  const siteContent = useCatalogStore((state) => state.content)
  const heroImageParallaxRef = useRef<HTMLDivElement>(null)
  const heroImageMouseRef = useRef<HTMLDivElement>(null)
  const intentionSectionRef = useRef<HTMLElement>(null)
  const intentionCardsRef = useRef<HTMLDivElement[]>([])
  const decorativeTextRef = useRef<HTMLDivElement>(null)
  const categorySectionRef = useRef<HTMLElement>(null)
  const categoryCardsRef = useRef<HTMLAnchorElement[]>([])
  const stepsSectionRef = useRef<HTMLElement>(null)
  const connectorPathRef = useRef<SVGPathElement>(null)
  const stepsRef = useRef<HTMLDivElement[]>([])
  const aboutImageRef = useRef<HTMLDivElement>(null)
  const faqSectionRef = useRef<HTMLElement>(null)

  const productTabs = useMemo(
    () =>
      categories.length
        ? [
            { id: 'all', label: 'Todos' },
            ...categories.map((category) => ({
              id: category.id,
              label: category.shortName || category.name,
            })),
          ]
        : fallbackProductTabs,
    [catalogVersion],
  )

  useEffect(() => {
    if (
      activeTab !== 'all' &&
      !categories.some((category) => category.id === activeTab)
    ) {
      setActiveTab('all')
    }
  }, [activeTab, catalogVersion])

  const filteredProducts = useMemo(() => {
    if (activeTab === 'all') {
      const highlightedProducts = products.filter(
        (product) => product.featured || product.bestseller,
      )

      return (highlightedProducts.length ? highlightedProducts : products).slice(0, 4)
    }

    return products
      .filter((product) => product.categoryId === activeTab)
      .slice(0, 4)
  }, [activeTab, catalogVersion])

  const visibleTestimonials =
    siteContent?.testimonials?.length ? siteContent.testimonials : testimonials
  const visibleFaqs = siteContent?.faqs?.length ? siteContent.faqs : faqItems

  const registerIntentionCard = useCallback(
    (node: HTMLDivElement | null, index: number) => {
      if (node) {
        intentionCardsRef.current[index] = node
      }
    },
    [],
  )

  const registerCategoryCard = useCallback(
    (node: HTMLAnchorElement | null, index: number) => {
      if (node) {
        categoryCardsRef.current[index] = node
      }
    },
    [],
  )

  const registerStep = useCallback((node: HTMLDivElement | null, index: number) => {
    if (node) {
      stepsRef.current[index] = node
    }
  }, [])

  const handleAddProduct = useCallback(
    (product: ProductCardItem) => {
      const sourceProduct = products.find((item) => item.id === product.id)

      if (
        !sourceProduct ||
        sourceProduct.status === 'sold-out' ||
        sourceProduct.stock <= 0
      ) {
        return
      }

      addItem({
        categoryId: sourceProduct.categoryId,
        id: sourceProduct.id,
        image:
          product.images?.[0]?.src ??
          sourceProduct.images[0]?.src ?? '',
        intention:
          intentions.find((intention) =>
            sourceProduct.intentionIds.includes(intention.id),
          )?.name ?? 'Ritual',
        name: sourceProduct.name,
        price: sourceProduct.price,
        sku: sourceProduct.sku,
        slug: sourceProduct.slug,
      })
    },
    [addItem],
  )

  useEffect(() => {
    const parallaxElement = heroImageParallaxRef.current
    const decorativeText = decorativeTextRef.current
    const connectorPath = connectorPathRef.current

    const context = gsap.context(() => {
      if (parallaxElement) {
        gsap.to(parallaxElement, {
          ease: 'none',
          scrollTrigger: {
            end: 'bottom top',
            scrub: 1,
            start: 'top top',
            trigger: parallaxElement,
          },
          y: -60,
        })
      }

      if (intentionSectionRef.current) {
        gsap.fromTo(
          intentionCardsRef.current,
          { opacity: 0, scale: 0.94, y: 80 },
          {
            duration: 0.78,
            ease: 'power3.out',
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              start: 'top 72%',
              trigger: intentionSectionRef.current,
            },
            stagger: 0.12,
            y: 0,
          },
        )
      }

      if (decorativeText) {
        gsap.to(decorativeText, {
          ease: 'none',
          scrollTrigger: {
            end: 'bottom top',
            scrub: 1.2,
            start: 'top bottom',
            trigger: intentionSectionRef.current,
          },
          y: -48,
        })
      }

      if (categorySectionRef.current) {
        categoryCardsRef.current.forEach((card, index) => {
          gsap.fromTo(
            card,
            { opacity: 0, x: index % 2 === 0 ? -72 : 72 },
            {
              duration: 0.72,
              ease: 'power3.out',
              opacity: 1,
              scrollTrigger: {
                start: 'top 82%',
                trigger: card,
              },
              x: 0,
            },
          )
        })
      }

      if (connectorPath && stepsSectionRef.current) {
        const length = connectorPath.getTotalLength()
        connectorPath.style.strokeDasharray = `${length}`
        connectorPath.style.strokeDashoffset = `${length}`

        gsap.to(connectorPath, {
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            start: 'top 68%',
            trigger: stepsSectionRef.current,
          },
          strokeDashoffset: 0,
        })

        gsap.fromTo(
          stepsRef.current,
          { opacity: 0, y: 36 },
          {
            duration: 0.58,
            ease: 'power3.out',
            opacity: 1,
            scrollTrigger: {
              start: 'top 70%',
              trigger: stepsSectionRef.current,
            },
            stagger: 0.15,
            y: 0,
          },
        )
      }

      if (aboutImageRef.current) {
        gsap.fromTo(
          aboutImageRef.current,
          { opacity: 0, x: -64 },
          {
            duration: 0.8,
            ease: 'power3.out',
            opacity: 1,
            scrollTrigger: {
              start: 'top 78%',
              trigger: aboutImageRef.current,
            },
            x: 0,
          },
        )
      }

      if (faqSectionRef.current) {
        gsap.fromTo(
          faqSectionRef.current.querySelectorAll('.faq-row'),
          { opacity: 0, y: 24 },
          {
            duration: 0.46,
            ease: 'power2.out',
            opacity: 1,
            scrollTrigger: {
              start: 'top 76%',
              trigger: faqSectionRef.current,
            },
            stagger: 0.1,
            y: 0,
          },
        )
      }
    })

    return () => context.revert()
  }, [])

  useEffect(() => {
    const element = heroImageMouseRef.current

    if (!element) {
      return
    }

    let frame = 0
    let currentX = 0
    let currentY = 0
    let targetX = 0
    let targetY = 0

    function update() {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08

      if (element) {
        element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`
      }

      frame = window.requestAnimationFrame(update)
    }

    function handleMouseMove(event: MouseEvent) {
      const x = event.clientX / window.innerWidth - 0.5
      const y = event.clientY / window.innerHeight - 0.5
      targetX = x * 24
      targetY = y * 24
    }

    document.addEventListener('mousemove', handleMouseMove)
    frame = window.requestAnimationFrame(update)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <main className="overflow-hidden bg-cream-light">
      <section className="auralith-hero-grain relative min-h-screen bg-cream pt-28">
        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-10 md:grid-cols-[55%_45%] md:px-8">
          <div className="relative z-10">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark"
              initial={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              Auralith — Tienda Holística
            </motion.p>
            <div className="mt-6">
              <HeroHeadline
                text={
                  siteContent?.heroText ||
                  'Productos holísticos para armonizar tu energía'
                }
              />
            </div>
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 max-w-2xl font-body text-lg font-light leading-relaxed text-ink-muted"
              initial={{ opacity: 0, y: 24 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              Cristales, aromas, kits rituales y piezas de altar seleccionadas
              para acompañar tus ciclos con belleza, intención y presencia.
            </motion.p>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 24 }}
              transition={{ delay: 0.6, duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                className="auralith-shimmer relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-7 font-body text-base font-medium text-ink shadow-gold transition-colors duration-300 ease-auralith hover:bg-gold-light"
                to="/tienda"
              >
                <span className="relative z-10">
                  {siteContent?.heroPrimaryButton || 'Comprar ahora'}
                </span>
              </Link>
              <Link
                className="auralith-shimmer relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full border border-gold/70 bg-transparent px-7 font-body text-base font-medium text-ink transition-colors duration-300 ease-auralith hover:border-sage hover:bg-sage/10"
                to="/tienda?intencion=self-love"
              >
                {siteContent?.heroSecondaryButton || 'Explorar intenciones'}
              </Link>
            </motion.div>
          </div>

          <HeroImage
            mouseRef={heroImageMouseRef}
            parallaxRef={heroImageParallaxRef}
          />
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 bottom-0 border-y border-gold/15 bg-cream/70 backdrop-blur-sm"
          initial={{ opacity: 0, y: 28 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-4 px-5 py-4 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:px-8">
            {values.map((value, index) => (
              <div className="contents" key={value.label}>
                <div className="flex items-center gap-3 text-ink">
                  <span className="text-gold">{value.icon}</span>
                  <span className="font-body text-xs font-medium uppercase tracking-widest">
                    {value.label}
                  </span>
                </div>
                {index < values.length - 1 ? (
                  <span className="hidden font-display text-gold/40 md:block">✦</span>
                ) : null}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <WaveDivider fill="#E8E2D6" />

      <section
        className="relative bg-cream-dark px-5 py-24 md:px-8 md:py-32"
        id="intenciones"
        ref={intentionSectionRef}
      >
        <div
          className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-display text-[80px] leading-none text-ink opacity-[0.04] md:block"
          ref={decorativeTextRef}
        >
          rituales con propósito
        </div>
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Navega con propósito"
            subtitle="Elige primero cómo quieres sentirte. Nosotros te mostramos piezas, aromas y rituales alineados con esa intención."
            title="Compra por intención"
          />
          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {intentions.map((intention, index) => (
              <div
                key={intention.id}
                ref={(node) => registerIntentionCard(node, index)}
              >
                <IntentionCard
                  href={`/tienda?intencion=${intention.slug}`}
                  image={intentionVisuals[intention.id]}
                  name={intention.name}
                  phrase={intention.affirmation}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider className="rotate-180" fill="#FAF8F3" />

      <section
        className="bg-cream-light px-5 py-24 md:px-8 md:py-32"
        id="categorias"
        ref={categorySectionRef}
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Universos Auralith"
            subtitle="Explora por tipo de producto: desde cristales y sahumos hasta cuidado sensorial y objetos para altar."
            title="Categorías principales"
          />
          <div className="mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible">
            {categories.slice(0, 4).map((category, index) => (
              <CategoryCard
                category={category}
                index={index}
                key={category.id}
                register={registerCategoryCard}
              />
            ))}
          </div>
          <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {categories.slice(4).map((category, offset) => (
              <CategoryCard
                category={category}
                index={offset + 4}
                key={category.id}
                register={registerCategoryCard}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center justify-center gap-2 md:hidden">
            <span className="font-body text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-dark">
              Desliza para explorar
            </span>
            <motion.span
              aria-hidden="true"
              animate={{ x: [0, 7, 0] }}
              className="font-display text-lg leading-none text-gold"
              transition={{ duration: 1.35, ease: 'easeInOut', repeat: Infinity }}
            >
              →
            </motion.span>
          </div>
        </div>
      </section>

      <WaveDivider fill="#F5F1E8" />

      <section className="bg-cream px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Selección especial"
            subtitle="Piezas destacadas para iniciar o profundizar tu práctica ritual."
            title="Productos destacados"
          />

          <div className="mx-auto mt-10 flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-gold/20 bg-cream-light p-1 md:w-fit md:rounded-full">
            {productTabs.map((tab) => (
              <button
                className="relative shrink-0 rounded-full px-5 py-2 font-body text-sm font-medium text-ink transition-colors"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {activeTab === tab.id ? (
                  <motion.span
                    className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-gold"
                    layoutId="activeTab"
                    transition={{ damping: 26, stiffness: 420, type: 'spring' }}
                  />
                ) : null}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          <motion.div
            className="mt-12 grid grid-cols-2 gap-4 sm:mt-14 sm:gap-6 lg:grid-cols-4"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 20 }}
                  initial={{ opacity: 0, scale: 0.96, y: 20 }}
                  key={`${activeTab}-${product.id}`}
                  layout
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard
                    onAdd={handleAddProduct}
                    product={mapProductToCard(product)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <WaveDivider className="rotate-180" fill="#222222" />

      <section
        className="relative bg-ink px-5 py-24 text-cream md:px-8 md:py-32"
        id="como-comprar"
        ref={stepsSectionRef}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
              Cómo comprar
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-cream-light md:text-5xl">
              Un pedido simple, una experiencia cuidada.
            </h2>
          </div>

          <div className="relative mt-16">
            <svg
              aria-hidden="true"
              className="absolute left-0 top-10 hidden h-10 w-full md:block"
              preserveAspectRatio="none"
              viewBox="0 0 1000 80"
            >
              <path
                d="M20 44C180 12 285 68 420 36c150-35 246 31 360-4 74-23 134-22 200 2"
                fill="none"
                ref={connectorPathRef}
                stroke="#C9A86A"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
            <div className="grid gap-8 md:grid-cols-5">
              {steps.map((step, index) => (
                <div
                  className="relative rounded-xl border border-cream/10 bg-cream/5 p-5"
                  key={step.title}
                  ref={(node) => registerStep(node, index)}
                >
                  <span className="absolute right-4 top-2 font-display text-[80px] leading-none text-gold opacity-10">
                    {index + 1}
                  </span>
                  <div className="relative z-10">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 text-gold">
                      {step.icon}
                    </div>
                    <h3 className="mt-8 font-display text-xl leading-tight text-cream-light">
                      {step.title}
                    </h3>
                    <p className="mt-3 font-body text-sm font-light leading-relaxed text-cream/70">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fill="#FAF8F3" />

      <section className="bg-cream-light px-5 py-24 md:px-8 md:py-32" id="sobre-auralith">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 md:grid-cols-2">
          <div className="relative" ref={aboutImageRef}>
            <div className="absolute -right-3 -top-3 h-full w-full rounded-2xl border border-gold" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sage/20 shadow-soft">
              <div className="h-full w-full bg-[radial-gradient(circle_at_25%_20%,rgba(201,168,106,0.45),transparent_30%),linear-gradient(145deg,rgba(143,165,140,0.22),rgba(250,248,243,0.86)),url('https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center" />
            </div>
          </div>
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
              Sobre Auralith
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-5xl">
              Una curaduría peruana para rituales cotidianos.
            </h2>
            <p className="mt-6 font-body text-base font-light leading-relaxed text-ink-muted">
              Auralith nace para volver el bienestar holístico más sensible,
              elegante y cercano. Elegimos piezas por su energía, materialidad y
              capacidad de acompañar momentos reales de cambio, descanso y
              claridad.
            </p>
            <blockquote className="mt-8 border-l border-gold pl-5 font-display text-2xl italic leading-snug text-sage-dark">
              “Creemos en objetos que no solo decoran: sostienen intención.”
            </blockquote>
            <Button className="mt-8" size="lg" variant="ghost">
              Conoce nuestra historia
            </Button>
          </div>
        </div>
      </section>

      <WaveDivider className="rotate-180" fill="#F5F1E8" />

      <section className="bg-cream px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Voces cercanas"
            subtitle="Experiencias de personas que eligieron ritualizar sus rutinas con Auralith."
            title="Testimonios"
          />
          <motion.div
            className="mt-12 flex cursor-grab gap-5 overflow-visible active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: -420, right: 0 }}
          >
            {visibleTestimonials.map((testimonial) => (
              <article
                className="min-w-[82vw] rounded-xl border border-gold/20 bg-cream-light p-7 shadow-soft md:min-w-[420px]"
                key={`${testimonial.author}-${testimonial.quote}`}
              >
                <p className="font-display text-2xl leading-snug text-ink">
                  “{testimonial.quote}”
                </p>
                <p className="mt-6 font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
                  {testimonial.author}
                </p>
              </article>
            ))}
          </motion.div>
        </div>
      </section>

      <WaveDivider fill="#FAF8F3" />

      <section
        className="bg-cream-light px-5 py-24 md:px-8 md:py-32"
        ref={faqSectionRef}
      >
        <div className="mx-auto max-w-4xl">
          <SectionTitle
            eyebrow="Dudas frecuentes"
            subtitle="Lo básico para comprar con confianza y elegir con intención."
            title="FAQ"
          />
          <div className="faq-row mt-12 rounded-xl border border-gold/20 bg-cream px-6">
            <Accordion items={visibleFaqs} />
          </div>
        </div>
      </section>

      <WaveDivider className="rotate-180" fill="#E9F0E7" />

      <section
        className="relative overflow-hidden bg-sage/15 px-5 py-24 text-center md:px-8 md:py-32"
        id="contacto"
      >
        {['left-[12%] top-20', 'right-[18%] top-32', 'left-[22%] bottom-24', 'right-[10%] bottom-16'].map(
          (position, index) => (
            <span
              aria-hidden="true"
              className={cn(
                'auralith-float absolute font-display text-3xl text-gold/50',
                position,
              )}
              key={position}
              style={{ '--float-delay': `${index * 0.8}s` } as CSSProperties}
            >
              ✦
            </span>
          ),
        )}
        <div className="relative z-10 mx-auto max-w-4xl">
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
            Cierre
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">
            ¿Lista para encontrar tu próximo ritual?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl font-body text-lg font-light leading-relaxed text-ink-muted">
            Escríbenos y te ayudamos a elegir por energía, ocasión o producto.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={() =>
                window.open('https://wa.me/51999999999', '_blank', 'noopener,noreferrer')
              }
              size="lg"
              variant="whatsapp"
            >
              Hablar por WhatsApp
            </Button>
            <Button
              onClick={() =>
                window.open('https://instagram.com', '_blank', 'noopener,noreferrer')
              }
              size="lg"
              variant="ghost"
            >
              Ver Instagram
            </Button>
          </div>
        </div>
        <Divider className="mx-auto mt-16 max-w-xl" />
      </section>
    </main>
  )
}
