import { AnimatePresence, motion } from 'framer-motion'
import {
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Layers3,
  PackagePlus,
  Pencil,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { compressImageFile, formatFileSize } from '../../lib/imageCompression'
import {
  notifyCatalogChanged,
  useAdminStore,
  type AdminCategory,
  type AdminIntention,
  type AdminProduct,
  type AdminProductImage,
  type AdminProductStatus,
  type AdminSubcategory,
} from '../../store'
import { cn } from '../../components/ui/utils'

type CatalogTab = 'bulk' | 'categories' | 'subcategories' | 'intentions'
type CategoryDraft = {
  active: boolean
  accentColor: string
  description: string
  featured: boolean
  heroCopy: string
  id: string
  imageUrl: string | null
  intentionIds: string[]
  name: string
  productCount: number
  seo: AdminCategory['seo']
  shortName: string
  slug: string
  sortOrder: number
}

type SubcategoryDraft = {
  active: boolean
  categoryId: string
  categorySlug: string
  description: string
  id: string
  name: string
  productCount: number
  seo: AdminSubcategory['seo']
  slug: string
  sortOrder: number
}

type IntentionDraft = {
  active: boolean
  affirmation: string
  benefits: string[]
  color: string
  description: string
  icon: string
  id: string
  imageUrl: string | null
  name: string
  recommendedProductIds: string[]
  relatedCategoryIds: string[]
  ritualPrompt: string
  seo: AdminIntention['seo']
  slug: string
  sortOrder: number
}

const statusLabels: Record<AdminProductStatus, string> = {
  active: 'Activo',
  draft: 'Borrador',
  hidden: 'Oculto',
  'sold-out': 'Agotado',
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function generateSku(
  name: string,
  categoryId: string,
  seed: string,
  categoryOptions: CategoryDraft[],
) {
  const category = categoryOptions.find((item) => item.id === categoryId)
  const categoryPrefix =
    (category?.shortName || category?.name || 'GEN')
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') || 'GEN'
  const namePrefix =
    slugify(name)
      .split('-')
      .map((part) => part[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || 'PRD'

  return `AUR-${categoryPrefix}-${namePrefix}-${seed}`
}

function toCategoryDraft(category: AdminCategory): CategoryDraft {
  return {
    accentColor: category.accentColor,
    active: category.active,
    description: category.description,
    featured: category.featured,
    heroCopy: category.heroCopy,
    id: category.id,
    imageUrl: category.imageUrl,
    intentionIds: category.intentionIds,
    name: category.name,
    productCount: category.productCount,
    seo: category.seo,
    shortName: category.shortName,
    slug: category.slug,
    sortOrder: category.sortOrder,
  }
}

function createEmptyCategoryDraft(sortOrder: number): CategoryDraft {
  const name = 'Nueva categoria'
  const slug = `categoria-${Date.now()}`

  return {
    accentColor: '#C9A86A',
    active: true,
    description: '',
    featured: false,
    heroCopy: '',
    id: `cat-${Date.now()}`,
    imageUrl: '',
    intentionIds: [],
    name,
    productCount: 0,
    seo: {
      description: name,
      keywords: [name],
      title: `${name} | Auralith`,
    },
    shortName: name,
    slug,
    sortOrder,
  }
}

function toSubcategoryDraft(subcategory: AdminSubcategory): SubcategoryDraft {
  return {
    active: subcategory.active,
    categoryId: subcategory.categoryId,
    categorySlug: subcategory.categorySlug,
    description: subcategory.description,
    id: subcategory.id,
    name: subcategory.name,
    productCount: subcategory.productCount,
    seo: subcategory.seo,
    slug: subcategory.slug,
    sortOrder: subcategory.sortOrder,
  }
}

function createEmptySubcategoryDraft(
  categoryId: string,
  categorySlug: string,
  sortOrder: number,
): SubcategoryDraft {
  const name = 'Nueva subcategoria'
  const slug = `subcategoria-${Date.now()}`

  return {
    active: true,
    categoryId,
    categorySlug,
    description: '',
    id: `sub-${Date.now()}`,
    name,
    productCount: 0,
    seo: {
      description: name,
      keywords: [name],
      title: `${name} | Auralith`,
    },
    slug,
    sortOrder,
  }
}

function toIntentionDraft(intention: AdminIntention): IntentionDraft {
  return {
    active: intention.active,
    affirmation: intention.affirmation,
    benefits: intention.benefits,
    color: intention.color,
    description: intention.description,
    icon: intention.icon,
    id: intention.id,
    imageUrl: intention.imageUrl,
    name: intention.name,
    recommendedProductIds: intention.recommendedProductIds,
    relatedCategoryIds: intention.relatedCategoryIds,
    ritualPrompt: intention.ritualPrompt,
    seo: intention.seo,
    slug: intention.slug,
    sortOrder: intention.sortOrder,
  }
}

function createEmptyIntentionDraft(sortOrder: number): IntentionDraft {
  const name = 'Nueva intencion'
  const slug = `intencion-${Date.now()}`

  return {
    active: true,
    affirmation: '',
    benefits: [],
    color: '#8FA58C',
    description: '',
    icon: 'sparkles',
    id: `int-${Date.now()}`,
    imageUrl: '',
    name,
    recommendedProductIds: [],
    relatedCategoryIds: [],
    ritualPrompt: '',
    seo: {
      description: name,
      keywords: [name],
      title: `${name} | Auralith`,
    },
    slug,
    sortOrder,
  }
}

function createSkuSeed() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
    .toUpperCase()
    .slice(-8)
}

function normalizeTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function StatusBadge({ status }: { status: AdminProductStatus }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-widest',
        status === 'active' && 'bg-sage/15 text-sage-light',
        status === 'draft' && 'bg-beige/15 text-beige-light',
        status === 'hidden' && 'bg-white/10 text-cream-dark/70',
        status === 'sold-out' && 'bg-red-500/15 text-red-300',
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

function AdminTextInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
        {label}
      </span>
      <input
        className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none transition-colors placeholder:text-cream-dark/30 focus:border-gold"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function ProductEditorDrawer({
  categoryOptions,
  intentionOptions,
  onClose,
  onSaved,
  open,
  product,
  subcategoryOptions,
}: {
  categoryOptions: CategoryDraft[]
  intentionOptions: IntentionDraft[]
  onClose: () => void
  onSaved: (product: AdminProduct) => void
  open: boolean
  product: AdminProduct | null
  subcategoryOptions: SubcategoryDraft[]
}) {
  const addToast = useAdminStore((state) => state.addToast)
  const upsertProduct = useAdminStore((state) => state.upsertProduct)
  const hydrate = useAdminStore((state) => state.hydrate)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [stock, setStock] = useState('0')
  const [categoryId, setCategoryId] = useState<string>('')
  const [intentionIds, setIntentionIds] = useState<string[]>([])
  const [subcategoryIds, setSubcategoryIds] = useState<string[]>([])
  const [status, setStatus] = useState<AdminProductStatus>('active')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [existingImages, setExistingImages] = useState<AdminProductImage[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [skuSeed, setSkuSeed] = useState(createSkuSeed)
  const availableCategories = categoryOptions.filter((category) => category.active)
  const firstCategoryId = availableCategories[0]?.id ?? ''
  const selectedCategoryId = categoryId || firstCategoryId
  const availableSubcategories = subcategoryOptions.filter(
    (subcategory) =>
      subcategory.active && subcategory.categoryId === selectedCategoryId,
  )
  const availableIntentions = intentionOptions.filter((intention) => intention.active)
  const sku =
    product?.sku ?? generateSku(name, selectedCategoryId, skuSeed, categoryOptions)

  useEffect(() => {
    if (!open) return

    const frame = window.requestAnimationFrame(() => {
      setFiles([])
      setSkuSeed(createSkuSeed())

      if (product) {
        setName(product.name)
        setPrice(String(product.price))
        setOfferPrice(product.offerPrice ? String(product.offerPrice) : '')
        setStock(String(product.stock))
        setCategoryId(product.categoryId)
        setIntentionIds(product.intentionIds)
        setSubcategoryIds(product.subcategoryIds)
        setStatus(product.status)
        setShortDescription(product.shortDescription)
        setDescription(product.description)
        setSeoTitle(product.seoTitle)
        setSeoDescription(product.seoDescription)
        setTagsText(product.tags.join(', '))
        setExistingImages(
          product.imageRecords.length
            ? product.imageRecords
            : product.images.map((image) => ({ src: image })),
        )
        return
      }

      setName('')
      setPrice('')
      setOfferPrice('')
      setStock('0')
      setCategoryId(firstCategoryId)
      setIntentionIds([])
      setSubcategoryIds([])
      setStatus('active')
      setShortDescription('')
      setDescription('')
      setSeoTitle('')
      setSeoDescription('')
      setTagsText('')
      setExistingImages([])
    })

    return () => window.cancelAnimationFrame(frame)
  }, [firstCategoryId, open, product])

  useEffect(() => {
    setSubcategoryIds((current) =>
      current.filter((id) =>
        subcategoryOptions.some(
          (subcategory) =>
            subcategory.id === id && subcategory.categoryId === selectedCategoryId,
        ),
      ),
    )
  }, [selectedCategoryId, subcategoryOptions])

  const saveProduct = async () => {
    const numericPrice = Number(price)
    const numericOfferPrice = offerPrice ? Number(offerPrice) : null
    const numericStock = Math.max(0, Number(stock) || 0)

    if (
      !name.trim() ||
      !selectedCategoryId ||
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0 ||
      (numericOfferPrice !== null &&
        (!Number.isFinite(numericOfferPrice) || numericOfferPrice <= 0))
    ) {
      addToast({
        message: 'Completa nombre, categoria, precio y oferta con valores validos.',
        title: 'Datos incompletos',
        variant: 'warning',
      })
      return
    }

    const normalizedSlug = product?.slug || slugify(name) || `producto-${skuSeed}`
    const id = product?.id ?? `prod-${normalizedSlug}-${skuSeed}`
    const baseProduct = product ?? {
      categoryId: selectedCategoryId,
      description: '',
      id,
      imageRecords: [],
      images: [],
      intentionIds: [],
      name: '',
      offerPrice: null,
      price: 0,
      seoDescription: '',
      seoTitle: '',
      shortDescription: '',
      sku,
      slug: normalizedSlug,
      status: 'active' as AdminProductStatus,
      stock: 0,
      subcategoryIds: [],
      tags: [],
    }

    setIsSaving(true)
    try {
      const savedProduct = await upsertProduct({
        ...baseProduct,
        categoryId: selectedCategoryId,
        description,
        id,
        imageRecords: existingImages,
        images: existingImages.map((image) => image.src),
        intentionIds,
        name: name.trim(),
        offerPrice: numericOfferPrice,
        price: numericPrice,
        seoDescription: seoDescription || shortDescription,
        seoTitle: seoTitle || `${name.trim()} | Auralith`,
        shortDescription,
        sku,
        slug: normalizedSlug,
        status,
        stock: numericStock,
        subcategoryIds,
        tags: normalizeTags(tagsText),
      })

      let totalSavedBytes = 0
      for (const file of files) {
        const compressed = await compressImageFile(file)
        totalSavedBytes += compressed.savedBytes
        const formData = new FormData()
        formData.set('file', compressed.file)
        await apiFetch(
          `/admin/products/${id}/images`,
          { body: formData, method: 'POST' },
          true,
        )
      }

      await hydrate()
      const refreshedProduct =
        useAdminStore.getState().products.find((item) => item.id === id) ??
        savedProduct
      onSaved(refreshedProduct)
      addToast({
        message: `${name.trim()} ya está guardado en el catálogo.`,
        title: product ? 'Producto actualizado' : 'Producto creado',
        variant: 'success',
      })
      if (totalSavedBytes > 0) {
        addToast({
          message: `Se redujo ${formatFileSize(totalSavedBytes)} antes de subir a Supabase.`,
          title: 'Imagenes optimizadas',
          variant: 'success',
        })
      }
      onClose()
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar.',
        title: product ? 'Error al actualizar' : 'Error al crear',
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteExistingImage = async (image: AdminProductImage) => {
    if (!image.id) {
      setExistingImages((current) => current.filter((item) => item.src !== image.src))
      return
    }

    try {
      await apiFetch(`/admin/product-images/${image.id}`, { method: 'DELETE' }, true)
      setExistingImages((current) => current.filter((item) => item.id !== image.id))
      await hydrate()
      addToast({
        message: 'La foto se retiro del producto.',
        title: 'Imagen eliminada',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo eliminar.',
        title: 'Error en imagen',
        variant: 'error',
      })
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
        >
          <button
            aria-label="Cerrar creación desde fondo"
            className="absolute inset-0"
            onClick={onClose}
            type="button"
          />
          <motion.aside
            animate={{ x: 0 }}
            className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#202020] shadow-lifted"
            exit={{ x: '100%' }}
            initial={{ x: '100%' }}
            transition={{ damping: 35, stiffness: 300, type: 'spring' }}
          >
            <header className="flex items-start justify-between border-b border-white/10 p-5">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
                  {product ? 'Edicion individual' : 'SKU automatico'}
                </p>
                <h2 className="mt-2 font-display text-3xl text-cream">
                  {product ? 'Editar producto' : 'Nuevo producto'}
                </h2>
              </div>
              <button
                aria-label="Cerrar"
                className="grid h-10 w-10 place-items-center rounded-full text-cream-dark transition-colors hover:bg-white/5 hover:text-cream"
                onClick={onClose}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-2xl border border-white/10 bg-[#191919] p-4">
                <div>
                  <ImagePlus className="mx-auto h-9 w-9 text-gold" />
                  <p className="mt-4 font-body text-sm text-cream">
                    Dropzone de imágenes
                  </p>
                  <p className="mt-2 font-body text-xs text-cream-dark/55">
                    Principal, galería, orden y eliminación.
                  </p>
                  <input
                    accept="image/*"
                    className="mt-4 block max-w-full font-body text-xs text-cream-dark file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-ink"
                    multiple
                    onChange={(event) =>
                      setFiles(Array.from(event.target.files ?? []))
                    }
                    type="file"
                  />
                </div>
              </div>

              {existingImages.length ? (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {existingImages.map((image, index) => (
                    <div
                      className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#111]"
                      key={`${image.id ?? image.src}-${index}`}
                    >
                      <img
                        alt={image.altText ?? name}
                        className="h-full w-full object-cover"
                        src={image.src}
                      />
                      {index === 0 ? (
                        <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-1 font-body text-[10px] font-semibold text-ink">
                          Principal
                        </span>
                      ) : null}
                      <button
                        aria-label="Eliminar foto"
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-ink/70 text-cream opacity-0 backdrop-blur transition-opacity hover:bg-red-500 group-hover:opacity-100"
                        onClick={() => void deleteExistingImage(image)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {files.length ? (
                <div className="mt-4 rounded-xl bg-gold/10 p-3">
                  <p className="font-body text-[11px] font-semibold uppercase tracking-widest text-gold">
                    Nuevas fotos por subir
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((file) => (
                      <span
                        className="rounded-full bg-white/10 px-3 py-1 font-body text-xs text-cream-dark"
                        key={`${file.name}-${file.size}`}
                      >
                        {file.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <AdminTextInput
                    label="Nombre"
                    onChange={setName}
                    placeholder="Ej. Pack ritual live"
                    value={name}
                  />
                </div>
                <label className="block">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    SKU automatico
                  </span>
                  <input
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#111] px-4 font-body text-sm text-cream-dark outline-none"
                    readOnly
                    value={sku}
                  />
                </label>
                <AdminTextInput label="Precio" onChange={setPrice} value={price} />
                <AdminTextInput
                  label="Precio oferta"
                  onChange={setOfferPrice}
                  placeholder="Opcional"
                  value={offerPrice}
                />
                <AdminTextInput label="Stock" onChange={setStock} value={stock} />
                <label className="block">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Estado
                  </span>
                  <select
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
                    onChange={(event) =>
                      setStatus(event.target.value as AdminProductStatus)
                    }
                    value={status}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Subcategorias
                  </span>
                  {availableSubcategories.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {availableSubcategories.map((subcategory) => {
                        const checked = subcategoryIds.includes(subcategory.id)

                        return (
                          <button
                            className={cn(
                              'flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left font-body text-sm transition-colors',
                              checked
                                ? 'border-gold bg-gold/10 text-gold'
                                : 'border-white/10 bg-[#191919] text-cream-dark hover:border-gold/35 hover:text-cream',
                            )}
                            key={subcategory.id}
                            onClick={() =>
                              setSubcategoryIds((current) =>
                                checked
                                  ? current.filter((id) => id !== subcategory.id)
                                  : [...current, subcategory.id],
                              )
                            }
                            type="button"
                          >
                            <span>{subcategory.name}</span>
                            <Check className={cn('h-4 w-4', !checked && 'opacity-0')} />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-[#191919] px-4 py-3 font-body text-sm text-cream-dark/55">
                      Aun no hay subcategorias activas para esta categoria.
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Intenciones
                  </span>
                  {availableIntentions.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {availableIntentions.map((intention) => {
                        const checked = intentionIds.includes(intention.id)

                        return (
                          <button
                            className={cn(
                              'flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left font-body text-sm transition-colors',
                              checked
                                ? 'border-sage bg-sage/10 text-sage-light'
                                : 'border-white/10 bg-[#191919] text-cream-dark hover:border-sage/35 hover:text-cream',
                            )}
                            key={intention.id}
                            onClick={() =>
                              setIntentionIds((current) =>
                                checked
                                  ? current.filter((id) => id !== intention.id)
                                  : [...current, intention.id],
                              )
                            }
                            type="button"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: intention.color }}
                              />
                              {intention.name}
                            </span>
                            <Check className={cn('h-4 w-4', !checked && 'opacity-0')} />
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-[#191919] px-4 py-3 font-body text-sm text-cream-dark/55">
                      Crea intenciones desde la pestaña de intenciones para asignarlas aqui.
                    </div>
                  )}
                </div>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Categoría
                  </span>
                  <select
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
                    onChange={(event) => setCategoryId(event.target.value)}
                    value={selectedCategoryId}
                  >
                    {availableCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Descripción corta
                  </span>
                  <textarea
                    className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-[#191919] px-4 py-3 font-body text-sm text-cream outline-none focus:border-gold"
                    onChange={(event) => setShortDescription(event.target.value)}
                    value={shortDescription}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Descripcion completa
                  </span>
                  <textarea
                    className="min-h-36 w-full resize-none rounded-xl border border-white/10 bg-[#191919] px-4 py-3 font-body text-sm text-cream outline-none focus:border-gold"
                    onChange={(event) => setDescription(event.target.value)}
                    value={description}
                  />
                </label>
                <AdminTextInput
                  label="Titulo SEO"
                  onChange={setSeoTitle}
                  value={seoTitle}
                />
                <AdminTextInput
                  label="Descripcion SEO"
                  onChange={setSeoDescription}
                  value={seoDescription}
                />
                <label className="block sm:col-span-2">
                  <span className="mb-2 block font-body text-xs font-semibold uppercase tracking-widest text-cream-dark/55">
                    Etiquetas
                  </span>
                  <input
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none transition-colors placeholder:text-cream-dark/30 focus:border-gold"
                    onChange={(event) => setTagsText(event.target.value)}
                    placeholder="Separadas por coma"
                    value={tagsText}
                  />
                </label>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-3 border-t border-white/10 p-5">
              <button
                className="rounded-full border border-white/15 px-5 py-2.5 font-body text-sm text-cream-dark transition-colors hover:bg-white/5"
                onClick={onClose}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-gold bg-gold px-5 py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
                disabled={isSaving}
                onClick={saveProduct}
                type="button"
              >
                <Save className="h-4 w-4" />
                {isSaving
                  ? 'Guardando...'
                  : product
                    ? 'Actualizar producto'
                    : 'Guardar producto'}
              </button>
            </footer>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export function AdminProductsPage() {
  const products = useAdminStore((state) => state.products)
  const adminCategories = useAdminStore((state) => state.categories)
  const adminIntentions = useAdminStore((state) => state.intentions)
  const adminSubcategories = useAdminStore((state) => state.subcategories)
  const hydrate = useAdminStore((state) => state.hydrate)
  const upsertProduct = useAdminStore((state) => state.upsertProduct)
  const deleteProduct = useAdminStore((state) => state.deleteProduct)
  const addToast = useAdminStore((state) => state.addToast)
  const [activeTab, setActiveTab] = useState<CatalogTab>('bulk')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [draftProducts, setDraftProducts] = useState<AdminProduct[]>(products)
  const [dirtyIds, setDirtyIds] = useState<string[]>([])
  const [editorProduct, setEditorProduct] = useState<AdminProduct | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraft[]>([])
  const [categoriesDirty, setCategoriesDirty] = useState(false)
  const [intentionDrafts, setIntentionDrafts] = useState<IntentionDraft[]>([])
  const [intentionsDirty, setIntentionsDirty] = useState(false)
  const [subcategoryDrafts, setSubcategoryDrafts] = useState<SubcategoryDraft[]>([])
  const [subcategoriesDirty, setSubcategoriesDirty] = useState(false)
  const [uploadingCategoryId, setUploadingCategoryId] = useState<string | null>(null)
  const [uploadingIntentionId, setUploadingIntentionId] = useState<string | null>(null)
  const savedCategoryIds = useRef<Set<string>>(new Set())
  const savedIntentionIds = useRef<Set<string>>(new Set())
  const savedSubcategoryIds = useRef<Set<string>>(new Set())
  const productCountByCategory = useMemo(() => {
    const counts = new Map<string, number>()

    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1)
    }

    return counts
  }, [products])
  const productCountBySubcategory = useMemo(() => {
    const counts = new Map<string, number>()

    for (const product of products) {
      for (const subcategoryId of product.subcategoryIds) {
        counts.set(subcategoryId, (counts.get(subcategoryId) ?? 0) + 1)
      }
    }

    return counts
  }, [products])
  const productCountByIntention = useMemo(() => {
    const counts = new Map<string, number>()

    for (const product of products) {
      for (const intentionId of product.intentionIds) {
        counts.set(intentionId, (counts.get(intentionId) ?? 0) + 1)
      }
    }

    return counts
  }, [products])
  const categoryOptions = useMemo(
    () =>
      categoryDrafts.map((category) => ({
        ...category,
        productCount: productCountByCategory.get(category.id) ?? 0,
      })),
    [categoryDrafts, productCountByCategory],
  )
  const subcategoryOptions = useMemo(
    () =>
      subcategoryDrafts.map((subcategory) => ({
        ...subcategory,
        productCount: productCountBySubcategory.get(subcategory.id) ?? 0,
      })),
    [productCountBySubcategory, subcategoryDrafts],
  )
  const intentionOptions = useMemo(
    () =>
      intentionDrafts.map((intention) => ({
        ...intention,
        recommendedProductIds: Array.from(
          { length: productCountByIntention.get(intention.id) ?? 0 },
          (_, index) => `${intention.id}-${index}`,
        ),
      })),
    [intentionDrafts, productCountByIntention],
  )

  useEffect(() => {
    if (categoriesDirty) return

    setCategoryDrafts(adminCategories.map(toCategoryDraft))
    savedCategoryIds.current = new Set(adminCategories.map((category) => category.id))
  }, [adminCategories, categoriesDirty])

  useEffect(() => {
    if (subcategoriesDirty) return

    setSubcategoryDrafts(adminSubcategories.map(toSubcategoryDraft))
    savedSubcategoryIds.current = new Set(
      adminSubcategories.map((subcategory) => subcategory.id),
    )
  }, [adminSubcategories, subcategoriesDirty])

  useEffect(() => {
    if (intentionsDirty) return

    setIntentionDrafts(adminIntentions.map(toIntentionDraft))
    savedIntentionIds.current = new Set(
      adminIntentions.map((intention) => intention.id),
    )
  }, [adminIntentions, intentionsDirty])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!dirtyIds.length) {
        setDraftProducts(products)
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [dirtyIds.length, products])

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return draftProducts.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.sku, product.tags.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesCategory =
        categoryFilter === 'all' || product.categoryId === categoryFilter

      return matchesQuery && matchesCategory
    })
  }, [categoryFilter, draftProducts, query])

  const markDirty = (productId: string) => {
    setDirtyIds((current) =>
      current.includes(productId) ? current : [...current, productId],
    )
  }

  const patchProduct = <Key extends keyof AdminProduct>(
    productId: string,
    key: Key,
    value: AdminProduct[Key],
  ) => {
    setDraftProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, [key]: value } : product,
      ),
    )
    markDirty(productId)
  }

  const saveBulkChanges = async () => {
    const changedProducts = draftProducts.filter((product) =>
      dirtyIds.includes(product.id),
    )

    try {
      const savedProducts = await Promise.all(
        changedProducts.map((product) => upsertProduct(product)),
      )
      setDraftProducts((current) =>
        current.map((product) => {
          const saved = savedProducts.find((item) => item.id === product.id)
          return saved ?? product
        }),
      )
      notifyCatalogChanged()
      addToast({
        message: `${dirtyIds.length} producto(s) se sincronizaron con Supabase.`,
        title: 'Edición masiva guardada',
        variant: 'success',
      })
      setDirtyIds([])
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar.',
        title: 'Error de sincronización',
        variant: 'error',
      })
    }
  }

  const updateCategory = <Key extends keyof CategoryDraft>(
    categoryId: string,
    key: Key,
    value: CategoryDraft[Key],
  ) => {
    setCategoriesDirty(true)
    setCategoryDrafts((current) =>
      current.map((category) =>
        category.id === categoryId ? { ...category, [key]: value } : category,
      ),
    )
  }

  const updateSubcategory = <Key extends keyof SubcategoryDraft>(
    subcategoryId: string,
    key: Key,
    value: SubcategoryDraft[Key],
  ) => {
    setSubcategoriesDirty(true)
    setSubcategoryDrafts((current) =>
      current.map((subcategory) =>
        subcategory.id === subcategoryId
          ? { ...subcategory, [key]: value }
          : subcategory,
      ),
    )
  }

  const updateIntention = <Key extends keyof IntentionDraft>(
    intentionId: string,
    key: Key,
    value: IntentionDraft[Key],
  ) => {
    setIntentionsDirty(true)
    setIntentionDrafts((current) =>
      current.map((intention) =>
        intention.id === intentionId ? { ...intention, [key]: value } : intention,
      ),
    )
  }

  const uploadCategoryImage = async (category: CategoryDraft, file: File) => {
    if (!savedCategoryIds.current.has(category.id)) {
      addToast({
        message: 'Guarda la categoria antes de subirle una foto.',
        title: 'Categoria pendiente',
        variant: 'warning',
      })
      return
    }

    setUploadingCategoryId(category.id)

    try {
      const compressed = await compressImageFile(file)
      const formData = new FormData()
      formData.set('file', compressed.file)

      const uploaded = await apiFetch<{
        imageUrl: string
      }>(
        `/admin/categories/${category.id}/image`,
        { body: formData, method: 'POST' },
        true,
      )

      setCategoryDrafts((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, imageUrl: uploaded.imageUrl } : item,
        ),
      )
      await hydrate()
      notifyCatalogChanged()
      addToast({
        message: `${category.name} ya muestra la nueva foto en la tienda.`,
        title: 'Foto de categoria actualizada',
        variant: 'success',
      })

      if (compressed.savedBytes > 0) {
        addToast({
          message: `Se redujo ${formatFileSize(compressed.savedBytes)} antes de subir a Supabase.`,
          title: 'Imagen optimizada',
          variant: 'success',
        })
      }
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo subir la foto.',
        title: 'Error en foto de categoria',
        variant: 'error',
      })
    } finally {
      setUploadingCategoryId(null)
    }
  }

  const uploadIntentionImage = async (intention: IntentionDraft, file: File) => {
    if (!savedIntentionIds.current.has(intention.id)) {
      addToast({
        message: 'Guarda la intencion antes de subirle una foto.',
        title: 'Intencion pendiente',
        variant: 'warning',
      })
      return
    }

    setUploadingIntentionId(intention.id)

    try {
      const compressed = await compressImageFile(file)
      const formData = new FormData()
      formData.set('file', compressed.file)

      const uploaded = await apiFetch<{
        imageUrl: string
      }>(
        `/admin/intentions/${intention.id}/image`,
        { body: formData, method: 'POST' },
        true,
      )

      setIntentionDrafts((current) =>
        current.map((item) =>
          item.id === intention.id
            ? { ...item, imageUrl: uploaded.imageUrl }
            : item,
        ),
      )
      await hydrate()
      notifyCatalogChanged()
      addToast({
        message: `${intention.name} ya muestra la nueva foto en la tienda.`,
        title: 'Foto de intencion actualizada',
        variant: 'success',
      })

      if (compressed.savedBytes > 0) {
        addToast({
          message: `Se redujo ${formatFileSize(compressed.savedBytes)} antes de subir a Supabase.`,
          title: 'Imagen optimizada',
          variant: 'success',
        })
      }
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo subir la foto.',
        title: 'Error en foto de intencion',
        variant: 'error',
      })
    } finally {
      setUploadingIntentionId(null)
    }
  }

  const saveCategories = async () => {
    try {
      const currentIds = new Set(categoryDrafts.map((category) => category.id))
      const deletedIds = [...savedCategoryIds.current].filter(
        (categoryId) => !currentIds.has(categoryId),
      )

      for (const categoryId of deletedIds) {
        await apiFetch(
          `/admin/categories/${categoryId}`,
          { method: 'DELETE' },
          true,
        )
      }

      for (const draft of categoryDrafts) {
        const source = adminCategories.find((category) => category.id === draft.id)
        const slug = source?.slug ?? draft.slug ?? slugify(draft.name) ?? draft.id
        const exists = savedCategoryIds.current.has(draft.id)

        await apiFetch(
          exists ? `/admin/categories/${draft.id}` : '/admin/categories',
          {
            body: JSON.stringify({
              accentColor: draft.accentColor || source?.accentColor || '#C9A86A',
              active: draft.active,
              description: draft.description || source?.description || '',
              featured: draft.featured ?? source?.featured ?? false,
              heroCopy: draft.heroCopy || source?.heroCopy || '',
              id: draft.id,
              imageUrl: draft.imageUrl ?? source?.imageUrl ?? '',
              intentionIds: draft.intentionIds ?? source?.intentionIds ?? [],
              name: draft.name,
              seo: draft.seo ?? source?.seo ?? {
                description: draft.name,
                keywords: [draft.name],
                title: `${draft.name} | Auralith`,
              },
              shortName: draft.shortName || source?.shortName || draft.name,
              slug,
              sortOrder: draft.sortOrder,
            }),
            method: exists ? 'PUT' : 'POST',
          },
          true,
        )
      }

      savedCategoryIds.current = currentIds
      await hydrate()
      notifyCatalogChanged()
      setCategoriesDirty(false)
      addToast({
        message: `${categoryDrafts.length} categorías se sincronizaron con Supabase.`,
        title: 'Categorías guardadas',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar.',
        title: 'Error en categorías',
        variant: 'error',
      })
    }
  }

  const saveSubcategories = async () => {
    try {
      const currentIds = new Set(subcategoryDrafts.map((subcategory) => subcategory.id))
      const deletedIds = [...savedSubcategoryIds.current].filter(
        (subcategoryId) => !currentIds.has(subcategoryId),
      )

      for (const subcategoryId of deletedIds) {
        await apiFetch(
          `/admin/subcategories/${subcategoryId}`,
          { method: 'DELETE' },
          true,
        )
      }

      for (const draft of subcategoryDrafts) {
        const source = adminSubcategories.find(
          (subcategory) => subcategory.id === draft.id,
        )
        const category = categoryOptions.find(
          (categoryItem) => categoryItem.id === draft.categoryId,
        )
        const slug = source?.slug ?? draft.slug ?? slugify(draft.name) ?? draft.id
        const exists = savedSubcategoryIds.current.has(draft.id)

        if (!draft.name.trim() || !draft.categoryId) {
          throw new Error('Cada subcategoria necesita nombre y categoria.')
        }

        await apiFetch(
          exists ? `/admin/subcategories/${draft.id}` : '/admin/subcategories',
          {
            body: JSON.stringify({
              active: draft.active,
              categoryId: draft.categoryId,
              description: draft.description || source?.description || '',
              id: draft.id,
              name: draft.name,
              seo: draft.seo ?? source?.seo ?? {
                description: draft.name,
                keywords: [draft.name, category?.name ?? 'Auralith'],
                title: `${draft.name} | Auralith`,
              },
              slug,
              sortOrder: draft.sortOrder,
            }),
            method: exists ? 'PUT' : 'POST',
          },
          true,
        )
      }

      savedSubcategoryIds.current = currentIds
      await hydrate()
      notifyCatalogChanged()
      setSubcategoriesDirty(false)
      addToast({
        message: `${subcategoryDrafts.length} subcategorias se sincronizaron con Supabase.`,
        title: 'Subcategorias guardadas',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar.',
        title: 'Error en subcategorias',
        variant: 'error',
      })
    }
  }

  const saveIntentions = async () => {
    try {
      const currentIds = new Set(intentionDrafts.map((intention) => intention.id))
      const deletedIds = [...savedIntentionIds.current].filter(
        (intentionId) => !currentIds.has(intentionId),
      )

      for (const intentionId of deletedIds) {
        await apiFetch(
          `/admin/intentions/${intentionId}`,
          { method: 'DELETE' },
          true,
        )
      }

      for (const draft of intentionDrafts) {
        const source = adminIntentions.find((intention) => intention.id === draft.id)
        const slug = source?.slug ?? draft.slug ?? slugify(draft.name) ?? draft.id
        const exists = savedIntentionIds.current.has(draft.id)

        if (!draft.name.trim()) {
          throw new Error('Cada intencion necesita un nombre.')
        }

        await apiFetch(
          exists ? `/admin/intentions/${draft.id}` : '/admin/intentions',
          {
            body: JSON.stringify({
              active: draft.active,
              affirmation: draft.affirmation || source?.affirmation || '',
              benefits: draft.benefits ?? source?.benefits ?? [],
              color: draft.color || source?.color || '#8FA58C',
              description: draft.description || source?.description || '',
              icon: draft.icon || source?.icon || 'sparkles',
              id: draft.id,
              imageUrl: draft.imageUrl ?? source?.imageUrl ?? '',
              name: draft.name,
              ritualPrompt: draft.ritualPrompt || source?.ritualPrompt || '',
              seo: draft.seo ?? source?.seo ?? {
                description: draft.name,
                keywords: [draft.name],
                title: `${draft.name} | Auralith`,
              },
              slug,
              sortOrder: draft.sortOrder,
            }),
            method: exists ? 'PUT' : 'POST',
          },
          true,
        )
      }

      savedIntentionIds.current = currentIds
      await hydrate()
      notifyCatalogChanged()
      setIntentionsDirty(false)
      addToast({
        message: `${intentionDrafts.length} intenciones se sincronizaron con Supabase.`,
        title: 'Intenciones guardadas',
        variant: 'success',
      })
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'No se pudo guardar.',
        title: 'Error en intenciones',
        variant: 'error',
      })
    }
  }

  const saveCategoryTree = async () => {
    await saveCategories()
    await saveSubcategories()
  }

  return (
    <div className="px-5 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
            Catálogo operativo
          </p>
          <h1 className="mt-2 font-display text-4xl text-cream">
            Productos y categorías
          </h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-cream-dark/60">
            Edición rápida para actualizar varios productos sin entrar uno por
            uno, con control de categorías y estados del catálogo.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-5 font-body text-sm text-cream-dark transition-colors hover:border-gold/35 hover:text-gold"
            onClick={() => setActiveTab('categories')}
            type="button"
          >
            <Layers3 className="h-4 w-4" />
            Categorías
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
            onClick={() => {
              setEditorProduct(null)
              setEditorOpen(true)
            }}
            type="button"
          >
            <PackagePlus className="h-4 w-4" />
            Nuevo producto
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto">
        {[
          { id: 'bulk', label: 'Edición masiva', icon: SlidersHorizontal },
          { id: 'categories', label: 'Categorías', icon: Layers3 },
          { id: 'intentions', label: 'Intenciones', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon
          const selected = activeTab === tab.id

          return (
            <button
              className={cn(
                'relative inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-5 font-body text-sm transition-colors',
                selected
                  ? 'border-gold bg-gold text-ink'
                  : 'border-white/10 text-cream-dark hover:border-gold/35 hover:text-gold',
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CatalogTab)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'bulk' ? (
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/5 bg-[#242424]"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            key="bulk"
          >
            <div className="grid gap-3 border-b border-white/5 p-4 lg:grid-cols-[1fr_220px_auto]">
              <label className="relative block">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dark/45" />
                <input
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#191919] pl-11 pr-4 font-body text-sm text-cream outline-none transition-colors placeholder:text-cream-dark/35 focus:border-gold"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre, SKU o etiqueta"
                  value={query}
                />
              </label>
              <select
                className="h-11 rounded-xl border border-white/10 bg-[#191919] px-4 font-body text-sm text-cream outline-none focus:border-gold"
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                <option value="all">Todas las categorías</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light disabled:pointer-events-none disabled:opacity-50"
                disabled={!dirtyIds.length}
                onClick={saveBulkChanges}
                type="button"
              >
                <Save className="h-4 w-4" />
                Guardar {dirtyIds.length || ''}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1160px] border-collapse">
                <thead>
                  <tr className="text-left font-body text-[11px] uppercase tracking-widest text-cream-dark/45">
                    <th className="px-5 py-3 font-medium">Producto</th>
                    <th className="px-5 py-3 font-medium">Categoría</th>
                    <th className="px-5 py-3 font-medium">Precio</th>
                    <th className="px-5 py-3 font-medium">Oferta</th>
                    <th className="px-5 py-3 font-medium">Stock</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      className={cn(
                        'border-t border-white/5 transition-colors hover:bg-white/5',
                        dirtyIds.includes(product.id) && 'bg-gold/5',
                      )}
                      key={product.id}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                            src={product.images[0]}
                          />
                          <div className="min-w-0">
                            <input
                              className="w-72 rounded-lg border border-transparent bg-transparent px-2 py-1 font-body text-sm font-semibold text-cream outline-none transition-colors focus:border-gold/40 focus:bg-[#191919]"
                              onChange={(event) =>
                                patchProduct(product.id, 'name', event.target.value)
                              }
                              value={product.name}
                            />
                            <p className="mt-1 px-2 font-body text-xs text-cream-dark/45">
                              {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          className="h-10 w-40 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                          onChange={(event) => {
                            patchProduct(product.id, 'categoryId', event.target.value)
                            patchProduct(product.id, 'subcategoryIds', [])
                          }}
                          value={product.categoryId}
                        >
                          {categoryOptions.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-10 w-28 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-gold outline-none focus:border-gold"
                          onChange={(event) =>
                            patchProduct(product.id, 'price', Number(event.target.value))
                          }
                          type="number"
                          value={product.price}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-10 w-28 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                          onChange={(event) =>
                            patchProduct(
                              product.id,
                              'offerPrice',
                              event.target.value ? Number(event.target.value) : null,
                            )
                          }
                          placeholder="-"
                          type="number"
                          value={product.offerPrice ?? ''}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <input
                          className="h-10 w-24 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                          onChange={(event) =>
                            patchProduct(product.id, 'stock', Number(event.target.value))
                          }
                          type="number"
                          value={product.stock}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <select
                            className="h-10 w-32 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                            onChange={(event) =>
                              patchProduct(
                                product.id,
                                'status',
                                event.target.value as AdminProductStatus,
                              )
                            }
                            value={product.status}
                          >
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <StatusBadge status={product.status} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {dirtyIds.includes(product.id) ? (
                            <span className="inline-flex h-9 items-center gap-1 rounded-full bg-gold/15 px-3 font-body text-xs text-gold">
                              <Pencil className="h-3.5 w-3.5" />
                              Editado
                            </span>
                          ) : (
                            <span className="inline-flex h-9 items-center gap-1 rounded-full bg-white/5 px-3 font-body text-xs text-cream-dark/55">
                              <Check className="h-3.5 w-3.5" />
                              OK
                            </span>
                          )}
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-white/5 px-3 font-body text-xs font-semibold text-cream-dark/70 transition-colors hover:bg-sage/10 hover:text-sage-light"
                            onClick={() => {
                              setEditorProduct(product)
                              setEditorOpen(true)
                            }}
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            aria-label={
                              product.status === 'hidden'
                                ? `Mostrar ${product.name}`
                                : `Ocultar ${product.name}`
                            }
                            className={cn(
                              'inline-flex h-9 items-center gap-2 rounded-full px-3 font-body text-xs font-semibold transition-colors',
                              product.status === 'hidden'
                                ? 'bg-sage/10 text-sage-light hover:bg-sage/15'
                                : 'bg-white/5 text-cream-dark/70 hover:bg-gold/10 hover:text-gold',
                            )}
                            onClick={async () => {
                              const nextStatus =
                                product.status === 'hidden'
                                  ? product.stock > 0
                                    ? 'active'
                                    : 'sold-out'
                                  : 'hidden'

                              try {
                                if (product.status === 'hidden') {
                                  await upsertProduct({ ...product, status: 'active' })
                                } else {
                                  await deleteProduct(product.id)
                                }
                                setDraftProducts((current) =>
                                  current.map((item) =>
                                    item.id === product.id
                                      ? { ...item, status: nextStatus }
                                      : item,
                                  ),
                                )
                                setDirtyIds((current) =>
                                  current.filter((id) => id !== product.id),
                                )
                                notifyCatalogChanged()
                                addToast({
                                  message:
                                    nextStatus === 'hidden'
                                      ? `${product.name} ya no aparece en la tienda.`
                                      : `${product.name} vuelve a estar visible.`,
                                  title:
                                    nextStatus === 'hidden'
                                      ? 'Producto oculto'
                                      : 'Producto visible',
                                  variant:
                                    nextStatus === 'hidden' ? 'warning' : 'success',
                                })
                              } catch (error) {
                                addToast({
                                  message:
                                    error instanceof Error
                                      ? error.message
                                      : 'No se pudo actualizar la visibilidad.',
                                  title: 'Error de visibilidad',
                                  variant: 'error',
                                })
                              }
                            }}
                            type="button"
                          >
                            {product.status === 'hidden' ? (
                              <>
                                <Eye className="h-4 w-4" />
                                Mostrar
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4" />
                                Ocultar
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        ) : null}

        {activeTab === 'categories' ? (
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            key="categories"
          >
            <div className="rounded-xl border border-white/5 bg-[#242424]">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
                <div>
                  <h2 className="font-display text-2xl text-cream">
                    Categorías de tienda
                  </h2>
                  <p className="mt-1 font-body text-xs text-cream-dark/50">
                    Edita nombre, orden y visibilidad desde una sola vista.
                  </p>
                </div>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/40 px-4 font-body text-xs text-gold transition-colors hover:bg-gold/10"
                  onClick={() => {
                    setCategoriesDirty(true)
                    setCategoryDrafts((current) => [
                      ...current,
                      {
                        ...createEmptyCategoryDraft(current.length + 1),
                        active: true,
                        id: `cat-${Date.now()}`,
                        name: 'Nueva categoría',
                        productCount: 0,
                        sortOrder: current.length + 1,
                      },
                    ])
                  }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {categoryOptions.map((category) => (
                  <div
                    className="grid gap-3 px-5 py-4 md:grid-cols-[112px_80px_minmax(0,1fr)_120px_120px_auto]"
                    key={category.id}
                  >
                    <div className="group relative h-24 overflow-hidden rounded-xl border border-white/10 bg-[#191919]">
                      {category.imageUrl ? (
                        <img
                          alt={category.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={category.imageUrl}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-gold/70">
                          <ImagePlus className="h-6 w-6" />
                        </div>
                      )}
                      <label className="absolute inset-x-2 bottom-2 inline-flex h-8 cursor-pointer items-center justify-center rounded-full bg-ink/75 px-3 font-body text-[11px] font-semibold text-cream backdrop-blur transition-colors hover:bg-gold hover:text-ink">
                        {uploadingCategoryId === category.id
                          ? 'Subiendo...'
                          : 'Cambiar foto'}
                        <input
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingCategoryId === category.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            event.currentTarget.value = ''

                            if (file) {
                              void uploadCategoryImage(category, file)
                            }
                          }}
                          type="file"
                        />
                      </label>
                    </div>
                    <input
                      className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                      onChange={(event) =>
                        updateCategory(category.id, 'sortOrder', Number(event.target.value))
                      }
                      type="number"
                      value={category.sortOrder}
                    />
                    <input
                      className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                      onChange={(event) =>
                        updateCategory(category.id, 'name', event.target.value)
                      }
                      value={category.name}
                    />
                    <span className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream-dark">
                      {category.productCount} productos
                    </span>
                    <button
                      className={cn(
                        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 font-body text-sm transition-colors',
                        category.active
                          ? 'border-sage/40 text-sage-light'
                          : 'border-white/10 text-cream-dark/45',
                      )}
                      onClick={() =>
                        updateCategory(category.id, 'active', !category.active)
                      }
                      type="button"
                    >
                      <Eye className="h-4 w-4" />
                      {category.active ? 'Visible' : 'Oculta'}
                    </button>
                    <button
                      className="grid h-10 w-10 place-items-center rounded-xl text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => {
                        setCategoriesDirty(true)
                        setCategoryDrafts((current) =>
                          current.filter((item) => item.id !== category.id),
                        )
                      }}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="rounded-xl border border-white/10 bg-[#191919] p-4 md:col-span-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-body text-[11px] font-semibold uppercase tracking-widest text-gold">
                            Subcategorias de {category.name}
                          </p>
                          <p className="mt-1 font-body text-xs text-cream-dark/55">
                            Estas opciones viven dentro de esta categoria y refinan el filtro.
                          </p>
                        </div>
                        <button
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-gold/40 px-4 font-body text-xs text-gold transition-colors hover:bg-gold/10"
                          onClick={() => {
                            setSubcategoriesDirty(true)
                            setSubcategoryDrafts((current) => [
                              ...current,
                              createEmptySubcategoryDraft(
                                category.id,
                                category.slug,
                                current.filter((item) => item.categoryId === category.id)
                                  .length + 1,
                              ),
                            ])
                          }}
                          type="button"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Agregar subcategoria
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {subcategoryOptions
                          .filter(
                            (subcategory) => subcategory.categoryId === category.id,
                          )
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((subcategory) => (
                            <div
                              className="grid gap-2 rounded-xl border border-white/5 bg-[#202020] p-3 lg:grid-cols-[72px_minmax(0,1fr)_minmax(0,1fr)_104px_106px_auto]"
                              key={subcategory.id}
                            >
                              <input
                                className="h-10 rounded-xl border border-white/10 bg-[#151515] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                                onChange={(event) =>
                                  updateSubcategory(
                                    subcategory.id,
                                    'sortOrder',
                                    Number(event.target.value),
                                  )
                                }
                                type="number"
                                value={subcategory.sortOrder}
                              />
                              <input
                                className="h-10 rounded-xl border border-white/10 bg-[#151515] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                                onChange={(event) => {
                                  updateSubcategory(
                                    subcategory.id,
                                    'name',
                                    event.target.value,
                                  )
                                  if (
                                    !savedSubcategoryIds.current.has(subcategory.id)
                                  ) {
                                    updateSubcategory(
                                      subcategory.id,
                                      'slug',
                                      slugify(event.target.value) || subcategory.slug,
                                    )
                                  }
                                }}
                                placeholder="Nombre"
                                value={subcategory.name}
                              />
                              <input
                                className="h-10 rounded-xl border border-white/10 bg-[#151515] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                                onChange={(event) =>
                                  updateSubcategory(
                                    subcategory.id,
                                    'slug',
                                    event.target.value,
                                  )
                                }
                                placeholder="slug"
                                value={subcategory.slug}
                              />
                              <span className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-[#151515] px-3 font-body text-sm text-cream-dark">
                                {subcategory.productCount} prod.
                              </span>
                              <button
                                className={cn(
                                  'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 font-body text-sm transition-colors',
                                  subcategory.active
                                    ? 'border-sage/40 text-sage-light'
                                    : 'border-white/10 text-cream-dark/45',
                                )}
                                onClick={() =>
                                  updateSubcategory(
                                    subcategory.id,
                                    'active',
                                    !subcategory.active,
                                  )
                                }
                                type="button"
                              >
                                <Eye className="h-4 w-4" />
                                {subcategory.active ? 'Visible' : 'Oculta'}
                              </button>
                              <button
                                className="grid h-10 w-10 place-items-center rounded-xl text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                onClick={() => {
                                  setSubcategoriesDirty(true)
                                  setSubcategoryDrafts((current) =>
                                    current.filter(
                                      (item) => item.id !== subcategory.id,
                                    ),
                                  )
                                }}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              <textarea
                                className="min-h-16 rounded-xl border border-white/10 bg-[#151515] px-3 py-2 font-body text-sm text-cream outline-none focus:border-gold lg:col-span-6"
                                onChange={(event) =>
                                  updateSubcategory(
                                    subcategory.id,
                                    'description',
                                    event.target.value,
                                  )
                                }
                                placeholder="Descripcion corta de la subcategoria"
                                value={subcategory.description}
                              />
                            </div>
                          ))}

                        {!subcategoryOptions.some(
                          (subcategory) => subcategory.categoryId === category.id,
                        ) ? (
                          <div className="rounded-xl border border-dashed border-white/10 px-4 py-3 font-body text-sm text-cream-dark/55">
                            Sin subcategorias aun. Puedes agregarlas cuando esta
                            categoria necesite filtros internos.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-xl border border-white/5 bg-[#242424] p-5">
              <Sparkles className="h-8 w-8 text-gold" />
              <h2 className="mt-4 font-display text-2xl text-cream">
                Guardado seguro
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-cream-dark/65">
                Guarda cambios de categorias y subcategorias hijas desde un solo
                arbol editable.
              </p>
              <button
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
                onClick={saveCategoryTree}
                type="button"
              >
                <Save className="h-4 w-4" />
                Guardar arbol de categorias
              </button>
              <div className="mt-5 rounded-xl border border-gold/20 bg-gold/10 p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-widest text-gold">
                  Regla sugerida
                </p>
                <p className="mt-2 font-body text-sm leading-relaxed text-cream-dark">
                  No borres una categoria o subcategoria con productos activos:
                  primero reasigna esos productos desde el editor.
                </p>
              </div>
            </aside>
          </motion.section>
        ) : null}

        {activeTab === 'subcategories' ? (
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            key="subcategories"
          >
            <div className="rounded-xl border border-white/5 bg-[#242424]">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
                <div>
                  <h2 className="font-display text-2xl text-cream">
                    Subcategorias por categoria
                  </h2>
                  <p className="mt-1 font-body text-xs text-cream-dark/50">
                    Crea pulseras, collares, kits u otras divisiones dentro de cada categoria.
                  </p>
                </div>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/40 px-4 font-body text-xs text-gold transition-colors hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!categoryOptions.length}
                  onClick={() => {
                    const category = categoryOptions[0]

                    if (!category) return

                    setSubcategoriesDirty(true)
                    setSubcategoryDrafts((current) => [
                      ...current,
                      createEmptySubcategoryDraft(
                        category.id,
                        category.slug,
                        current.length + 1,
                      ),
                    ])
                  }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {subcategoryOptions.length ? (
                  subcategoryOptions.map((subcategory) => (
                    <div
                      className="grid gap-3 px-5 py-4 lg:grid-cols-[180px_76px_minmax(0,1fr)_minmax(0,1fr)_110px_112px_auto]"
                      key={subcategory.id}
                    >
                      <select
                        className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                        onChange={(event) => {
                          const category = categoryOptions.find(
                            (item) => item.id === event.target.value,
                          )

                          updateSubcategory(
                            subcategory.id,
                            'categoryId',
                            event.target.value,
                          )
                          updateSubcategory(
                            subcategory.id,
                            'categorySlug',
                            category?.slug ?? '',
                          )
                        }}
                        value={subcategory.categoryId}
                      >
                        {categoryOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                        onChange={(event) =>
                          updateSubcategory(
                            subcategory.id,
                            'sortOrder',
                            Number(event.target.value),
                          )
                        }
                        type="number"
                        value={subcategory.sortOrder}
                      />
                      <input
                        className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                        onChange={(event) => {
                          updateSubcategory(subcategory.id, 'name', event.target.value)
                          if (!savedSubcategoryIds.current.has(subcategory.id)) {
                            updateSubcategory(
                              subcategory.id,
                              'slug',
                              slugify(event.target.value) || subcategory.slug,
                            )
                          }
                        }}
                        value={subcategory.name}
                      />
                      <input
                        className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                        onChange={(event) =>
                          updateSubcategory(subcategory.id, 'slug', event.target.value)
                        }
                        value={subcategory.slug}
                      />
                      <span className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream-dark">
                        {subcategory.productCount} productos
                      </span>
                      <button
                        className={cn(
                          'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 font-body text-sm transition-colors',
                          subcategory.active
                            ? 'border-sage/40 text-sage-light'
                            : 'border-white/10 text-cream-dark/45',
                        )}
                        onClick={() =>
                          updateSubcategory(
                            subcategory.id,
                            'active',
                            !subcategory.active,
                          )
                        }
                        type="button"
                      >
                        <Eye className="h-4 w-4" />
                        {subcategory.active ? 'Visible' : 'Oculta'}
                      </button>
                      <button
                        className="grid h-10 w-10 place-items-center rounded-xl text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => {
                          setSubcategoriesDirty(true)
                          setSubcategoryDrafts((current) =>
                            current.filter((item) => item.id !== subcategory.id),
                          )
                        }}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <textarea
                        className="min-h-20 rounded-xl border border-white/10 bg-[#191919] px-3 py-2 font-body text-sm text-cream outline-none focus:border-gold lg:col-span-7"
                        onChange={(event) =>
                          updateSubcategory(
                            subcategory.id,
                            'description',
                            event.target.value,
                          )
                        }
                        placeholder="Descripcion interna o SEO corto"
                        value={subcategory.description}
                      />
                    </div>
                  ))
                ) : (
                  <div className="px-5 py-10 text-center font-body text-sm text-cream-dark/55">
                    Aun no hay subcategorias. Crea una para que aparezca en filtros y productos.
                  </div>
                )}
              </div>
            </div>

            <aside className="rounded-xl border border-white/5 bg-[#242424] p-5">
              <Layers3 className="h-8 w-8 text-gold" />
              <h2 className="mt-4 font-display text-2xl text-cream">
                Filtros mas finos
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-cream-dark/65">
                Las subcategorias viven dentro de una categoria y luego se asignan
                desde el editor de producto. En tienda aparecen como filtros.
              </p>
              <button
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
                onClick={saveSubcategories}
                type="button"
              >
                <Save className="h-4 w-4" />
                Guardar subcategorias
              </button>
            </aside>
          </motion.section>
        ) : null}

        {activeTab === 'intentions' ? (
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
            exit={{ opacity: 0, y: 10 }}
            initial={{ opacity: 0, y: 10 }}
            key="intentions"
          >
            <div className="rounded-xl border border-white/5 bg-[#242424]">
              <div className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
                <div>
                  <h2 className="font-display text-2xl text-cream">
                    Intenciones de compra
                  </h2>
                  <p className="mt-1 font-body text-xs text-cream-dark/50">
                    Edita nombre, color, foto y visibilidad de las intenciones.
                  </p>
                </div>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-gold/40 px-4 font-body text-xs text-gold transition-colors hover:bg-gold/10"
                  onClick={() => {
                    setIntentionsDirty(true)
                    setIntentionDrafts((current) => [
                      ...current,
                      createEmptyIntentionDraft(current.length + 1),
                    ])
                  }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {intentionOptions.map((intention) => (
                  <div
                    className="grid gap-3 px-5 py-4 lg:grid-cols-[112px_72px_64px_minmax(0,1fr)_minmax(0,1fr)_110px_112px_auto]"
                    key={intention.id}
                  >
                    <div className="group relative h-24 overflow-hidden rounded-xl border border-white/10 bg-[#191919]">
                      {intention.imageUrl ? (
                        <img
                          alt={intention.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          src={intention.imageUrl}
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-sage-light">
                          <Sparkles className="h-6 w-6" />
                        </div>
                      )}
                      <label className="absolute inset-x-2 bottom-2 inline-flex h-8 cursor-pointer items-center justify-center rounded-full bg-ink/75 px-3 font-body text-[11px] font-semibold text-cream backdrop-blur transition-colors hover:bg-gold hover:text-ink">
                        {uploadingIntentionId === intention.id
                          ? 'Subiendo...'
                          : 'Cambiar foto'}
                        <input
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingIntentionId === intention.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            event.currentTarget.value = ''

                            if (file) {
                              void uploadIntentionImage(intention, file)
                            }
                          }}
                          type="file"
                        />
                      </label>
                    </div>
                    <input
                      className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                      onChange={(event) =>
                        updateIntention(
                          intention.id,
                          'sortOrder',
                          Number(event.target.value),
                        )
                      }
                      type="number"
                      value={intention.sortOrder}
                    />
                    <input
                      className="h-10 rounded-xl border border-white/10 bg-[#191919] px-2"
                      onChange={(event) =>
                        updateIntention(intention.id, 'color', event.target.value)
                      }
                      type="color"
                      value={intention.color}
                    />
                    <input
                      className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                      onChange={(event) => {
                        updateIntention(intention.id, 'name', event.target.value)
                        if (!savedIntentionIds.current.has(intention.id)) {
                          updateIntention(
                            intention.id,
                            'slug',
                            slugify(event.target.value) || intention.slug,
                          )
                        }
                      }}
                      value={intention.name}
                    />
                    <input
                      className="h-10 rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream outline-none focus:border-gold"
                      onChange={(event) =>
                        updateIntention(intention.id, 'slug', event.target.value)
                      }
                      value={intention.slug}
                    />
                    <span className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-[#191919] px-3 font-body text-sm text-cream-dark">
                      {intention.recommendedProductIds.length} productos
                    </span>
                    <button
                      className={cn(
                        'inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 font-body text-sm transition-colors',
                        intention.active
                          ? 'border-sage/40 text-sage-light'
                          : 'border-white/10 text-cream-dark/45',
                      )}
                      onClick={() =>
                        updateIntention(intention.id, 'active', !intention.active)
                      }
                      type="button"
                    >
                      <Eye className="h-4 w-4" />
                      {intention.active ? 'Visible' : 'Oculta'}
                    </button>
                    <button
                      className="grid h-10 w-10 place-items-center rounded-xl text-cream-dark/60 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      onClick={() => {
                        setIntentionsDirty(true)
                        setIntentionDrafts((current) =>
                          current.filter((item) => item.id !== intention.id),
                        )
                      }}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <textarea
                      className="min-h-20 rounded-xl border border-white/10 bg-[#191919] px-3 py-2 font-body text-sm text-cream outline-none focus:border-gold lg:col-span-4"
                      onChange={(event) =>
                        updateIntention(
                          intention.id,
                          'description',
                          event.target.value,
                        )
                      }
                      placeholder="Descripcion visible de la intencion"
                      value={intention.description}
                    />
                    <textarea
                      className="min-h-20 rounded-xl border border-white/10 bg-[#191919] px-3 py-2 font-body text-sm text-cream outline-none focus:border-gold lg:col-span-4"
                      onChange={(event) =>
                        updateIntention(
                          intention.id,
                          'benefits',
                          normalizeTags(event.target.value),
                        )
                      }
                      placeholder="Beneficios separados por coma"
                      value={intention.benefits.join(', ')}
                    />
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-xl border border-white/5 bg-[#242424] p-5">
              <Sparkles className="h-8 w-8 text-gold" />
              <h2 className="mt-4 font-display text-2xl text-cream">
                Navegacion por energia
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed text-cream-dark/65">
                Las intenciones alimentan tarjetas del home, filtros de tienda y
                asignaciones del producto.
              </p>
              <button
                className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 font-body text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
                onClick={saveIntentions}
                type="button"
              >
                <Save className="h-4 w-4" />
                Guardar intenciones
              </button>
            </aside>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <ProductEditorDrawer
        categoryOptions={categoryOptions}
        intentionOptions={intentionOptions}
        onClose={() => {
          setEditorOpen(false)
          setEditorProduct(null)
        }}
        onSaved={(savedProduct) => {
          setDraftProducts((current) => {
            const exists = current.some((item) => item.id === savedProduct.id)

            if (exists) {
              return current.map((item) =>
                item.id === savedProduct.id ? savedProduct : item,
              )
            }

            return [savedProduct, ...current]
          })
          setDirtyIds((current) =>
            current.filter((productId) => productId !== savedProduct.id),
          )
        }}
        open={editorOpen}
        product={editorProduct}
        subcategoryOptions={subcategoryOptions}
      />
    </div>
  )
}
