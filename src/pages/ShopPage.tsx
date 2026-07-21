import { AnimatePresence, motion } from 'framer-motion'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  categories,
  intentions,
  products,
  subcategories,
  type Category,
  type Intention,
  type Product,
  type ProductStatus,
  type Subcategory,
} from '../data'
import { useCartStore, useCatalogStore } from '../store'
import { Accordion } from '../components/ui/Accordion'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ProductCard, type ProductCardItem } from '../components/ui/ProductCard'
import { cn } from '../components/ui/utils'

type AvailabilityFilter = Extract<
  ProductStatus,
  'available' | 'low-stock' | 'preorder'
>
type SortOption = 'destacados' | 'precio-asc' | 'precio-desc' | 'recientes'
type ViewMode = 'grid' | 'list'

type FilterState = {
  availability: AvailabilityFilter[]
  categories: string[]
  intentions: string[]
  price: [number, number]
  sort: SortOption
  subcategories: string[]
}

type FilterPatch = Partial<FilterState>

type ActivePill = {
  id: string
  label: string
  onRemove: () => void
}

const PAGE_SIZE = 9

const sortOptions: { label: string; value: SortOption }[] = [
  { label: 'Recientes', value: 'recientes' },
  { label: 'Destacados', value: 'destacados' },
  { label: 'Precio menor', value: 'precio-asc' },
  { label: 'Precio mayor', value: 'precio-desc' },
]

const availabilityOptions: {
  label: string
  value: AvailabilityFilter
}[] = [
  { label: 'Disponible', value: 'available' },
  { label: 'Últimas unidades', value: 'low-stock' },
  { label: 'Preventa', value: 'preorder' },
]

const catalogPrices = products.map((product) => product.price)
const minCatalogPrice = catalogPrices.length ? Math.min(...catalogPrices) : 0
const maxCatalogPrice = catalogPrices.length ? Math.max(...catalogPrices) : 9999

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function splitParam(value: string | null) {
  return value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

function findCategoryByParam(value: string): Category | undefined {
  const normalized = normalize(value)
  const aliases: Record<string, string> = {
    altar: 'home-altar',
    aromas: 'sahumos-aromas',
    cristales: 'crystals-minerals',
    inciensos: 'sahumos-aromas',
    joyeria: 'energetic-jewelry',
    kits: 'ritual-kits',
  }

  return categories.find((category) => {
    const matchers = [
      category.id,
      category.slug,
      category.name,
      category.shortName,
      aliases[normalized] ?? '',
    ].map(normalize)

    return matchers.includes(normalized) || category.id === aliases[normalized]
  })
}

function findIntentionByParam(value: string): Intention | undefined {
  const normalized = normalize(value)
  const aliases: Record<string, string> = {
    amor: 'self-love',
    limpieza: 'energy-cleansing',
    sueno: 'calm-sleep',
  }

  return intentions.find((intention) => {
    const matchers = [
      intention.id,
      intention.slug,
      intention.name,
      aliases[normalized] ?? '',
    ].map(normalize)

    return matchers.includes(normalized) || intention.id === aliases[normalized]
  })
}

function findSubcategoryByParam(value: string): Subcategory | undefined {
  const normalized = normalize(value)

  return subcategories.find((subcategory) => {
    const matchers = [
      subcategory.id,
      subcategory.slug,
      subcategory.name,
      subcategory.categorySlug,
    ].map(normalize)

    return matchers.includes(normalized)
  })
}

function parseFilters(searchParams: URLSearchParams): FilterState {
  const selectedCategories = splitParam(searchParams.get('categoria'))
    .map(findCategoryByParam)
    .filter((category): category is Category => Boolean(category))
    .map((category) => category.id)
  const selectedIntentions = splitParam(searchParams.get('intencion'))
    .map(findIntentionByParam)
    .filter((intention): intention is Intention => Boolean(intention))
    .map((intention) => intention.id)
  const selectedSubcategories = splitParam(searchParams.get('subcategoria'))
    .map(findSubcategoryByParam)
    .filter((subcategory): subcategory is Subcategory => Boolean(subcategory))
    .map((subcategory) => subcategory.id)
  const selectedSubcategoryCategoryIds = selectedSubcategories
    .map((id) => subcategories.find((subcategory) => subcategory.id === id)?.categoryId)
    .filter((id): id is string => Boolean(id))
  const selectedAvailability = splitParam(searchParams.get('disponibilidad'))
    .filter((status): status is AvailabilityFilter =>
      availabilityOptions.some((option) => option.value === status),
    )
  const minPriceParam = searchParams.get('precioMin')
  const maxPriceParam = searchParams.get('precioMax')
  const minPrice = minPriceParam === null ? Number.NaN : Number(minPriceParam)
  const maxPrice = maxPriceParam === null ? Number.NaN : Number(maxPriceParam)
  const sortParam = searchParams.get('sort')
  const sort = sortOptions.some((option) => option.value === sortParam)
    ? (sortParam as SortOption)
    : 'recientes'

  return {
    availability: Array.from(new Set(selectedAvailability)),
    categories: Array.from(
      new Set([...selectedCategories, ...selectedSubcategoryCategoryIds]),
    ),
    intentions: Array.from(new Set(selectedIntentions)),
    price: [
      Number.isFinite(minPrice) ? minPrice : minCatalogPrice,
      Number.isFinite(maxPrice) ? maxPrice : maxCatalogPrice,
    ],
    sort,
    subcategories: Array.from(new Set(selectedSubcategories)),
  }
}

function writeFiltersToParams(
  searchParams: URLSearchParams,
  patch: FilterPatch,
) {
  const current = parseFilters(searchParams)
  const nextState = { ...current, ...patch }
  const next = new URLSearchParams(searchParams)

  if (nextState.categories.length) {
    next.set(
      'categoria',
      nextState.categories
        .map((id) => categories.find((category) => category.id === id)?.slug ?? id)
        .join(','),
    )
  } else {
    next.delete('categoria')
  }

  if (nextState.intentions.length) {
    next.set(
      'intencion',
      nextState.intentions
        .map(
          (id) => intentions.find((intention) => intention.id === id)?.slug ?? id,
        )
        .join(','),
    )
  } else {
    next.delete('intencion')
  }

  if (nextState.subcategories.length) {
    next.set(
      'subcategoria',
      nextState.subcategories
        .map(
          (id) =>
            subcategories.find((subcategory) => subcategory.id === id)?.slug ?? id,
        )
        .join(','),
    )
  } else {
    next.delete('subcategoria')
  }

  if (nextState.availability.length) {
    next.set('disponibilidad', nextState.availability.join(','))
  } else {
    next.delete('disponibilidad')
  }

  if (
    nextState.price[0] !== minCatalogPrice ||
    nextState.price[1] !== maxCatalogPrice
  ) {
    next.set('precioMin', String(nextState.price[0]))
    next.set('precioMax', String(nextState.price[1]))
  } else {
    next.delete('precioMin')
    next.delete('precioMax')
  }

  if (nextState.sort !== 'recientes') {
    next.set('sort', nextState.sort)
  } else {
    next.delete('sort')
  }

  return next
}

function getProductCategoryLabel(product: Product) {
  const category = categories.find((item) => item.id === product.categoryId)

  return category?.shortName || category?.name || 'Categoria'
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
    intentionLabel: getProductCategoryLabel(product),
    name: product.name,
    price: product.price,
    slug: product.slug,
    status: product.status,
    stock: product.stock,
  }
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'grid h-4 w-4 place-items-center rounded border transition-colors',
        checked
          ? 'border-gold bg-gold text-ink'
          : 'border-gold/40 bg-cream-light',
      )}
    >
      {checked ? (
        <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 16 16">
          <path
            d="m3.5 8.5 2.8 2.8 6.2-6.6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ) : null}
    </span>
  )
}

function GridIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 18 18">
      <path d="M3 3h4v4H3V3Zm8 0h4v4h-4V3ZM3 11h4v4H3v-4Zm8 0h4v4h-4v-4Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 18 18">
      <path d="M4 5h11M4 9h11M4 13h11M2 5h.01M2 9h.01M2 13h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 18 18">
      <path d="M2 4h14M5 9h8M7 14h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
    </svg>
  )
}

function EmptyCrystalIcon() {
  return (
    <svg aria-hidden="true" className="mx-auto h-32 w-32 text-gold" fill="none" viewBox="0 0 120 120">
      <path
        d="m60 14 28 30-10 48H42L32 44l28-30Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M32 44h56M60 14 47 44l13 48 13-48-13-30Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeOpacity="0.45"
        strokeWidth="2"
      />
      <path
        d="M93 18c1.4 4.5 4.1 7.2 8.5 8.5-4.4 1.4-7.1 4.2-8.5 8.5-1.3-4.3-4.1-7.1-8.5-8.5 4.4-1.3 7.2-4 8.5-8.5Z"
        fill="currentColor"
        fillOpacity="0.26"
      />
    </svg>
  )
}

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const start = displayValue
    const difference = value - start
    const startTime = performance.now()
    const duration = 420
    let frame = 0

    function update(now: number) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setDisplayValue(Math.round(start + difference * eased))

      if (progress < 1) {
        frame = requestAnimationFrame(update)
      }
    }

    frame = requestAnimationFrame(update)

    return () => cancelAnimationFrame(frame)
  }, [displayValue, value])

  return <span>{displayValue}</span>
}

function RangeSlider({
  max,
  min,
  onChange,
  value,
}: {
  max: number
  min: number
  onChange: (value: [number, number]) => void
  value: [number, number]
}) {
  const [dragging, setDragging] = useState<'max' | 'min' | null>(null)
  const minPercent = ((value[0] - min) / (max - min)) * 100
  const maxPercent = ((value[1] - min) / (max - min)) * 100

  const updateMin = (nextMin: number) => {
    onChange([Math.min(nextMin, value[1] - 1), value[1]])
  }

  const updateMax = (nextMax: number) => {
    onChange([value[0], Math.max(nextMax, value[0] + 1)])
  }

  return (
    <div className="px-1 pb-2 pt-8">
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gold/15" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-gold"
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
        {(['min', 'max'] as const).map((handle) => {
          const percent = handle === 'min' ? minPercent : maxPercent
          const label = handle === 'min' ? value[0] : value[1]

          return (
            <motion.span
              animate={{ opacity: dragging === handle ? 1 : 0, y: dragging === handle ? -6 : 0 }}
              className="pointer-events-none absolute top-[-1.85rem] -translate-x-1/2 rounded-full bg-ink px-2 py-1 font-body text-[10px] text-cream-light"
              key={handle}
              style={{ left: `${percent}%` }}
            >
              S/ {label}
            </motion.span>
          )
        })}
        <input
          aria-label="Precio mínimo"
          className="auralith-range-input"
          max={max}
          min={min}
          onChange={(event) => updateMin(Number(event.target.value))}
          onPointerDown={() => setDragging('min')}
          onPointerUp={() => setDragging(null)}
          step={1}
          type="range"
          value={value[0]}
        />
        <input
          aria-label="Precio máximo"
          className="auralith-range-input"
          max={max}
          min={min}
          onChange={(event) => updateMax(Number(event.target.value))}
          onPointerDown={() => setDragging('max')}
          onPointerUp={() => setDragging(null)}
          step={1}
          type="range"
          value={value[1]}
        />
      </div>
      <div className="mt-2 flex justify-between font-body text-xs text-ink-muted">
        <span>S/ {value[0]}</span>
        <span>S/ {value[1]}</span>
      </div>
    </div>
  )
}

function FilterTitle({ children }: { children: ReactNode }) {
  return (
    <span className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
      {children}
    </span>
  )
}

function FilterPanel({
  activePills,
  filters,
  onClear,
  onPatch,
}: {
  activePills: ActivePill[]
  filters: FilterState
  onClear: () => void
  onPatch: (patch: FilterPatch) => void
}) {
  const toggleCategory = (id: string) => {
    const nextCategories = filters.categories.includes(id)
      ? filters.categories.filter((categoryId) => categoryId !== id)
      : [...filters.categories, id]

    onPatch({
      categories: nextCategories,
      subcategories: filters.subcategories.filter((subcategoryId) => {
        const subcategory = subcategories.find((item) => item.id === subcategoryId)

        return (
          !subcategory ||
          !nextCategories.length ||
          nextCategories.includes(subcategory.categoryId)
        )
      }),
    })
  }

  const toggleIntention = (id: string) => {
    onPatch({
      intentions: filters.intentions.includes(id)
        ? filters.intentions.filter((intentionId) => intentionId !== id)
        : [...filters.intentions, id],
    })
  }

  const getSubcategoriesForCategory = (categoryId: string) =>
    subcategories.filter(
      (subcategory) => subcategory.active && subcategory.categoryId === categoryId,
    )

  const toggleSubcategory = (id: string) => {
    onPatch({
      subcategories: filters.subcategories.includes(id)
        ? filters.subcategories.filter((subcategoryId) => subcategoryId !== id)
        : [...filters.subcategories, id],
    })
  }

  const toggleAvailability = (value: AvailabilityFilter) => {
    onPatch({
      availability: filters.availability.includes(value)
        ? filters.availability.filter((status) => status !== value)
        : [...filters.availability, value],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl text-ink">Filtros</h2>
        <AnimatePresence>
          {activePills.length ? (
            <motion.button
              animate={{ opacity: 1 }}
              className="font-body text-sm font-medium text-sage-dark"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={onClear}
              type="button"
            >
              Limpiar filtros
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      <Accordion
        allowMultiple
        className="divide-gold/15"
        defaultOpenIds={[
          'categories',
          'intentions',
          'price',
          'availability',
        ]}
        items={[
          {
            answer: (
              <div className="space-y-3">
                {categories.map((category) => {
                  const checked = filters.categories.includes(category.id)
                  const childSubcategories = getSubcategoriesForCategory(category.id)

                  return (
                    <div key={category.id}>
                      <button
                        className="flex w-full items-center gap-3 text-left font-body text-sm text-ink"
                        onClick={() => toggleCategory(category.id)}
                        type="button"
                      >
                        <CheckboxIcon checked={checked} />
                        <span className="flex-1">{category.name}</span>
                        {childSubcategories.length ? (
                          <span className="font-body text-[11px] uppercase tracking-widest text-ink-muted/60">
                            {childSubcategories.length}
                          </span>
                        ) : null}
                      </button>

                      <AnimatePresence initial={false}>
                        {checked && childSubcategories.length ? (
                          <motion.div
                            animate={{ height: 'auto', opacity: 1 }}
                            className="ml-7 mt-3 overflow-hidden border-l border-gold/20 pl-3"
                            exit={{ height: 0, opacity: 0 }}
                            initial={{ height: 0, opacity: 0 }}
                          >
                            <div className="space-y-2">
                              {childSubcategories.map((subcategory) => (
                                <button
                                  className="flex w-full items-center gap-3 text-left font-body text-sm text-ink-muted transition-colors hover:text-ink"
                                  key={subcategory.id}
                                  onClick={() => toggleSubcategory(subcategory.id)}
                                  type="button"
                                >
                                  <CheckboxIcon
                                    checked={filters.subcategories.includes(
                                      subcategory.id,
                                    )}
                                  />
                                  <span>{subcategory.name}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            ),
            id: 'categories',
            question: <FilterTitle>Categorías</FilterTitle>,
          },
          {
            answer: (
              <div className="space-y-3">
                {intentions.map((intention) => (
                  <button
                    className="flex w-full items-center gap-3 text-left font-body text-sm text-ink"
                    key={intention.id}
                    onClick={() => toggleIntention(intention.id)}
                    type="button"
                  >
                    <CheckboxIcon checked={filters.intentions.includes(intention.id)} />
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: intention.color }}
                    />
                    <span>{intention.name}</span>
                  </button>
                ))}
              </div>
            ),
            id: 'intentions',
            question: <FilterTitle>Intenciones</FilterTitle>,
          },
          {
            answer: (
              <RangeSlider
                max={maxCatalogPrice}
                min={minCatalogPrice}
                onChange={(price) => onPatch({ price })}
                value={filters.price}
              />
            ),
            id: 'price',
            question: <FilterTitle>Precio</FilterTitle>,
          },
          {
            answer: (
              <div className="space-y-3">
                {availabilityOptions.map((option) => {
                  const checked = filters.availability.includes(option.value)

                  return (
                    <button
                      aria-pressed={checked}
                      className="flex w-full items-center justify-between gap-3 font-body text-sm text-ink"
                      key={option.value}
                      onClick={() => toggleAvailability(option.value)}
                      type="button"
                    >
                      <span>{option.label}</span>
                      <span
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          checked ? 'bg-sage' : 'bg-beige/25',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 h-4 w-4 rounded-full bg-cream-light shadow-sm transition-transform',
                            checked ? 'translate-x-6' : 'translate-x-1',
                          )}
                        />
                      </span>
                    </button>
                  )
                })}
              </div>
            ),
            id: 'availability',
            question: <FilterTitle>Disponibilidad</FilterTitle>,
          },
        ]}
      />
    </div>
  )
}

function FilterBottomSheet({
  activePills,
  filters,
  onClear,
  onClose,
  onPatch,
  open,
}: {
  activePills: ActivePill[]
  filters: FilterState
  onClear: () => void
  onClose: () => void
  onPatch: (patch: FilterPatch) => void
  open: boolean
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-modal bg-ink/35 lg:hidden"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <button
            aria-label="Cerrar filtros"
            className="absolute inset-0"
            onClick={onClose}
            type="button"
          />
          <motion.aside
            animate={{ y: 0 }}
            className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-2xl bg-cream-light px-5 pb-8 pt-4 shadow-lifted"
            drag="y"
            dragConstraints={{ bottom: 0, top: 0 }}
            dragElastic={0.18}
            exit={{ y: '100%' }}
            initial={{ y: '100%' }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) {
                onClose()
              }
            }}
            transition={{ damping: 30, stiffness: 300, type: 'spring' }}
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-gold/30" />
            <FilterPanel
              activePills={activePills}
              filters={filters}
              onClear={onClear}
              onPatch={onPatch}
            />
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function SortMenu({
  onChange,
  value,
}: {
  onChange: (value: SortOption) => void
  value: SortOption
}) {
  const [open, setOpen] = useState(false)
  const activeLabel = sortOptions.find((option) => option.value === value)?.label

  return (
    <div className="relative">
      <button
        className="flex h-10 min-w-40 items-center justify-between gap-3 rounded-full border border-gold/25 bg-cream-light px-4 font-body text-sm text-ink"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {activeLabel}
        <span className="text-gold">⌄</span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-10 w-48 overflow-hidden rounded-xl border border-gold/20 bg-cream-light shadow-soft"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: -8 }}
          >
            {sortOptions.map((option) => (
              <button
                className={cn(
                  'block w-full px-4 py-3 text-left font-body text-sm transition-colors hover:bg-sage/10',
                  option.value === value && 'text-gold-dark',
                )}
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function ViewToggle({
  onChange,
  value,
}: {
  onChange: (value: ViewMode) => void
  value: ViewMode
}) {
  return (
    <div className="relative flex rounded-full border border-gold/20 bg-cream-light p-1">
      {(['grid', 'list'] as const).map((mode) => (
        <button
          aria-label={mode === 'grid' ? 'Vista grilla' : 'Vista lista'}
          className="relative grid h-8 w-8 place-items-center rounded-full text-ink"
          key={mode}
          onClick={() => onChange(mode)}
          type="button"
        >
          {value === mode ? (
            <motion.span
              className="absolute inset-0 rounded-full bg-gold/20"
              layoutId="shop-view-mode"
              transition={{ damping: 26, stiffness: 420, type: 'spring' }}
            />
          ) : null}
          <span className="relative z-10">
            {mode === 'grid' ? <GridIcon /> : <ListIcon />}
          </span>
        </button>
      ))}
    </div>
  )
}

function ActiveFilterPills({ pills }: { pills: ActivePill[] }) {
  return (
    <AnimatePresence initial={false}>
      {pills.length ? (
        <motion.div
          animate={{ height: 'auto', opacity: 1 }}
          className="overflow-hidden"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
        >
          <div className="flex flex-wrap gap-2 pt-5">
            <AnimatePresence mode="popLayout">
              {pills.map((pill) => (
                <motion.button
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 rounded-full border border-gold/25 bg-cream px-3 py-1.5 font-body text-xs text-ink shadow-sm"
                  exit={{ opacity: 0, scale: 0.86 }}
                  initial={{ opacity: 0, scale: 0.86 }}
                  key={pill.id}
                  layout
                  onClick={pill.onRemove}
                  transition={{ damping: 18, stiffness: 420, type: 'spring' }}
                  type="button"
                >
                  {pill.label}
                  <span className="text-gold">x</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function ListProductCard({
  onAdd,
  product,
}: {
  onAdd: (product: ProductCardItem) => void
  product: Product
}) {
  const cardProduct = mapProductToCard(product)
  const isSoldOut = product.status === 'sold-out' || product.stock <= 0
  const isLowStock = !isSoldOut && (product.status === 'low-stock' || product.stock <= 5)
  const productImage = product.images[0]?.src
  const categoryLabel = getProductCategoryLabel(product)

  return (
    <motion.article
      className="grid grid-cols-[80px_1fr] gap-4 rounded-xl border border-gold/15 bg-cream-light p-3 shadow-sm md:grid-cols-[80px_1fr_auto]"
      layout
    >
      <div className="h-20 w-20 overflow-hidden rounded-lg bg-cream-dark">
        {productImage ? (
          <img
            alt={product.images[0]?.alt ?? product.name}
            className="h-full w-full object-cover"
            src={productImage}
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <span className="font-display text-2xl text-gold/45">A</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <Badge
          variant={
            isSoldOut
              ? 'soldOut'
              : isLowStock
                ? 'lowStock'
                : product.isNew
                  ? 'new'
                  : 'intention'
          }
        >
          {isSoldOut
            ? 'Stock agotado'
            : isLowStock
              ? 'Stock bajo'
              : product.isNew
                ? 'Nuevo'
                : categoryLabel}
        </Badge>
        <h3 className="mt-2 font-display text-xl leading-tight text-ink">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 font-body text-sm font-light text-ink-muted">
          {product.shortDescription}
        </p>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-1 md:flex-col md:items-end md:justify-center">
        <p className="font-body text-base font-semibold text-gold">
          {currencyFormatter.format(product.price)}
        </p>
        <Button disabled={isSoldOut} onClick={() => onAdd(cardProduct)} size="sm">
          {isSoldOut ? 'Agotado' : 'Agregar'}
        </Button>
      </div>
    </motion.article>
  )
}

function LoadingDots() {
  return (
    <div className="flex justify-center gap-2 py-8">
      {[0, 1, 2].map((index) => (
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -5, 0] }}
          className="h-2.5 w-2.5 rounded-full bg-sage"
          key={index}
          transition={{
            delay: index * 0.14,
            duration: 0.72,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  )
}

const currencyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  style: 'currency',
})

export function ShopPage() {
  const catalogVersion = useCatalogStore((state) => state.version)
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [pagination, setPagination] = useState({
    count: PAGE_SIZE,
    signature: '',
  })
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const addItem = useCartStore((state) => state.addItem)
  const filters = useMemo(
    () => parseFilters(searchParams),
    [catalogVersion, searchParams],
  )
  const filterSignature = searchParams.toString()

  const patchFilters = useCallback(
    (patch: FilterPatch) => {
      setSearchParams(writeFiltersToParams(searchParams, patch), { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const filteredProducts = useMemo(() => {
    const nextProducts = products.filter((product) => {
      const matchesCategory =
        !filters.categories.length ||
        filters.categories.includes(product.categoryId)
      const matchesIntention =
        !filters.intentions.length ||
        product.intentionIds.some((intentionId) =>
          filters.intentions.includes(intentionId),
        )
      const matchesSubcategory =
        !filters.subcategories.length ||
        product.subcategoryIds.some((subcategoryId) =>
          filters.subcategories.includes(subcategoryId),
        )
      const matchesPrice =
        product.price >= filters.price[0] && product.price <= filters.price[1]
      const matchesAvailability =
        !filters.availability.length ||
        filters.availability.includes(product.status as AvailabilityFilter)

      return (
        matchesCategory &&
        matchesIntention &&
        matchesSubcategory &&
        matchesPrice &&
        matchesAvailability
      )
    })

    return [...nextProducts].sort((a, b) => {
      if (filters.sort === 'precio-asc') {
        return a.price - b.price
      }

      if (filters.sort === 'precio-desc') {
        return b.price - a.price
      }

      if (filters.sort === 'destacados') {
        return Number(b.featured || b.bestseller) - Number(a.featured || a.bestseller)
      }

      return Number(b.isNew) - Number(a.isNew)
    })
  }, [catalogVersion, filters])

  const visibleCount =
    pagination.signature === filterSignature ? pagination.count : PAGE_SIZE
  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredProducts.length

  useEffect(() => {
    const sentinel = sentinelRef.current

    if (!sentinel || !hasMore || isLoadingMore) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoadingMore(true)
          window.setTimeout(() => {
            setPagination((current) => ({
              count:
                (current.signature === filterSignature
                  ? current.count
                  : PAGE_SIZE) + 6,
              signature: filterSignature,
            }))
            setIsLoadingMore(false)
          }, 560)
        }
      },
      { rootMargin: '240px' },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [filterSignature, hasMore, isLoadingMore])

  const addProductToCart = useCallback(
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

  const activePills = useMemo<ActivePill[]>(() => {
    const pills: ActivePill[] = []

    filters.categories.forEach((id) => {
      const category = categories.find((item) => item.id === id)

      if (category) {
        pills.push({
          id: `category-${id}`,
          label: category.shortName,
          onRemove: () =>
            patchFilters({
              categories: filters.categories.filter((item) => item !== id),
            }),
        })
      }
    })

    filters.intentions.forEach((id) => {
      const intention = intentions.find((item) => item.id === id)

      if (intention) {
        pills.push({
          id: `intention-${id}`,
          label: intention.name,
          onRemove: () =>
            patchFilters({
              intentions: filters.intentions.filter((item) => item !== id),
            }),
        })
      }
    })

    filters.subcategories.forEach((id) => {
      const subcategory = subcategories.find((item) => item.id === id)

      if (subcategory) {
        pills.push({
          id: `subcategory-${id}`,
          label: subcategory.name,
          onRemove: () =>
            patchFilters({
              subcategories: filters.subcategories.filter((item) => item !== id),
            }),
        })
      }
    })

    filters.availability.forEach((status) => {
      const option = availabilityOptions.find((item) => item.value === status)

      if (option) {
        pills.push({
          id: `availability-${status}`,
          label: option.label,
          onRemove: () =>
            patchFilters({
              availability: filters.availability.filter((item) => item !== status),
            }),
        })
      }
    })

    if (
      filters.price[0] !== minCatalogPrice ||
      filters.price[1] !== maxCatalogPrice
    ) {
      pills.push({
        id: 'price',
        label: `S/ ${filters.price[0]} - S/ ${filters.price[1]}`,
        onRemove: () => patchFilters({ price: [minCatalogPrice, maxCatalogPrice] }),
      })
    }

    return pills
  }, [catalogVersion, filters, patchFilters])

  const breadcrumbSegments = useMemo(() => {
    const segments = ['Tienda']
    const category = categories.find((item) => item.id === filters.categories[0])

    if (category) {
      segments.push(category.shortName)
    }

    const subcategory = subcategories.find(
      (item) => item.id === filters.subcategories[0],
    )

    if (subcategory) {
      segments.push(subcategory.name)
    }

    return segments
  }, [catalogVersion, filters.categories, filters.subcategories])

  const suggestedIntentions = filters.intentions.length
    ? intentions.filter((intention) => !filters.intentions.includes(intention.id)).slice(0, 3)
    : intentions.slice(0, 3)

  return (
    <main className="min-h-screen bg-cream pt-28">
      <section className="border-b border-gold/15 px-5 pb-8 pt-8 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-sage-dark">
            Catálogo Auralith
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-5xl leading-tight text-ink md:text-6xl">
                Tienda
              </h1>
              <p className="mt-3 max-w-2xl font-body text-base font-light leading-relaxed text-ink-muted">
                Explora productos holísticos por intención, categoría,
                disponibilidad y presupuesto.
              </p>
            </div>
            <Button
              className="w-fit lg:hidden"
              icon={<FilterIcon />}
              onClick={() => setMobileFiltersOpen(true)}
              variant="ghost"
            >
              Filtros
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="sticky top-[80px] hidden h-[calc(100vh-80px)] overflow-y-auto border-r border-gold/20 bg-cream-light px-5 py-7 lg:block">
          <FilterPanel
            activePills={activePills}
            filters={filters}
            onClear={clearFilters}
            onPatch={patchFilters}
          />
        </aside>

        <section className="min-w-0 px-5 py-7 md:px-8">
          <div className="flex flex-col gap-5 border-b border-gold/15 pb-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-2">
              <p className="font-body text-sm text-ink-muted">
                <span className="font-semibold text-ink">
                  <AnimatedCounter value={filteredProducts.length} />
                </span>{' '}
                productos encontrados
              </p>
              <div className="flex items-center gap-2 font-body text-xs uppercase tracking-widest text-ink-muted">
                <AnimatePresence mode="popLayout">
                  {breadcrumbSegments.map((segment, index) => (
                    <motion.span
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(index === breadcrumbSegments.length - 1 && 'text-gold-dark')}
                      exit={{ opacity: 0, y: -6 }}
                      initial={{ opacity: 0, y: 6 }}
                      key={`${segment}-${index}`}
                      layout
                    >
                      {segment}
                      {index < breadcrumbSegments.length - 1 ? ' >' : ''}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <SortMenu
                onChange={(sort) => patchFilters({ sort })}
                value={filters.sort}
              />
              <ViewToggle onChange={setViewMode} value={viewMode} />
            </div>
          </div>

          <ActiveFilterPills pills={activePills} />

          {filteredProducts.length ? (
            <>
              <motion.div
                className={cn(
                  'pt-7',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'
                    : 'grid grid-cols-1 gap-4',
                )}
                layout
              >
                <AnimatePresence mode="popLayout">
                  {visibleProducts.map((product, index) => (
                    <motion.div
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.96, y: 20 }}
                      key={`${viewMode}-${product.id}`}
                      layout
                      transition={{
                        delay: index * 0.05,
                        duration: 0.24,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {viewMode === 'grid' ? (
                        <ProductCard
                          onAdd={addProductToCart}
                          product={mapProductToCard(product)}
                        />
                      ) : (
                        <ListProductCard
                          onAdd={addProductToCart}
                          product={product}
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              <div ref={sentinelRef}>
                {isLoadingMore ? <LoadingDots /> : null}
              </div>
            </>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto flex min-h-[52vh] max-w-xl flex-col items-center justify-center py-16 text-center"
              initial={{ opacity: 0, y: 24 }}
            >
              <EmptyCrystalIcon />
              <h2 className="mt-6 font-display text-3xl text-ink">
                No encontramos productos con esos filtros
              </h2>
              <p className="mt-3 font-body text-sm font-light leading-relaxed text-ink-muted">
                Prueba abrir el rango de precio o explorar una intención
                cercana.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggestedIntentions.map((intention) => (
                  <button
                    className="rounded-full border border-gold/25 px-4 py-2 font-body text-xs uppercase tracking-widest text-sage-dark"
                    key={intention.id}
                    onClick={() => patchFilters({ intentions: [intention.id] })}
                    type="button"
                  >
                    {intention.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </div>

      <FilterBottomSheet
        activePills={activePills}
        filters={filters}
        onClear={clearFilters}
        onClose={() => setMobileFiltersOpen(false)}
        onPatch={patchFilters}
        open={mobileFiltersOpen}
      />
    </main>
  )
}
