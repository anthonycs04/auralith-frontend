import { create } from 'zustand'
import { apiFetch } from '../lib/api'
import { notifyCatalogChanged } from './useCatalogStore'

export type AdminProductStatus = 'active' | 'draft' | 'hidden' | 'sold-out'
export type AdminOrderStatus =
  | 'cancelled'
  | 'confirmed'
  | 'contacted'
  | 'delivered'
  | 'new'
  | 'preparing'
export type AdminOrderSource = 'store' | 'tiktok' | 'web'
export type ShippingMethod =
  | 'Flores'
  | 'Marvisur'
  | 'Olva Courier'
  | 'Recojo en tienda'
  | 'Shalom'
export type ToastVariant = 'error' | 'success' | 'warning'

export const shippingMethods: ShippingMethod[] = [
  'Flores',
  'Shalom',
  'Olva Courier',
  'Marvisur',
  'Recojo en tienda',
]

export type AdminProduct = {
  categoryId: string
  description: string
  id: string
  imageRecords: AdminProductImage[]
  images: string[]
  intentionIds: string[]
  name: string
  offerPrice?: number | null
  price: number
  seoDescription: string
  seoTitle: string
  shortDescription: string
  sku: string
  slug: string
  status: AdminProductStatus
  stock: number
  subcategoryIds: string[]
  tags: string[]
}

export type AdminProductImage = {
  altText?: string
  id?: string
  isPrimary?: boolean
  src: string
}

export type AdminCategory = {
  accentColor: string
  active: boolean
  description: string
  featured: boolean
  heroCopy: string
  id: string
  imageUrl: string | null
  intentionIds: string[]
  name: string
  productCount: number
  seo: {
    description?: string
    keywords?: string[]
    title?: string
  }
  shortName: string
  slug: string
  sortOrder: number
}

export type AdminOrderItem = {
  name: string
  price: number
  productId: string
  quantity: number
}

export type AdminOrder = {
  city: string
  code: string
  createdAt: string
  customer: string
  deliveryType: ShippingMethod
  id: string
  items: AdminOrderItem[]
  note?: string
  source: AdminOrderSource
  status: AdminOrderStatus
  total: number
  whatsapp: string
}

export type AdminContent = {
  faqs: Array<{
    answer: string
    id: string
    question: string
  }>
  heroPrimaryButton: string
  heroSecondaryButton: string
  heroText: string
  instagramHandle: string
  schedule: string
  storyText: string
  testimonials: Array<{
    author: string
    id: string
    quote: string
  }>
  whatsappNumber: string
}

export type AdminToast = {
  id: string
  message: string
  title: string
  variant: ToastVariant
}

export type OrderMutationResult = {
  message?: string
  success: boolean
}

type ApiProduct = {
  categoryId: string
  compareAtPrice: number | null
  description: string
  id: string
  images: AdminProductImage[]
  intentionIds: string[]
  name: string
  price: number
  seo: { description?: string; title?: string }
  shortDescription: string
  sku: string
  slug: string
  status: string
  stock: number
  tags: string[]
}

type AdminState = {
  addOrder: (order: AdminOrder) => Promise<OrderMutationResult>
  addToast: (toast: Omit<AdminToast, 'id'>) => void
  categories: AdminCategory[]
  content: AdminContent
  deleteProduct: (productId: string) => Promise<void>
  dismissToast: (toastId: string) => void
  error: string | null
  hydrate: () => Promise<void>
  isLoading: boolean
  orders: AdminOrder[]
  products: AdminProduct[]
  removeOrder: (orderId: string) => void
  toasts: AdminToast[]
  toggleProductVisibility: (productId: string) => Promise<void>
  updateContent: (content: AdminContent) => Promise<void>
  updateOrderItems: (
    orderId: string,
    items: AdminOrderItem[],
  ) => Promise<OrderMutationResult>
  updateOrderStatus: (
    orderId: string,
    status: AdminOrderStatus,
  ) => Promise<void>
  upsertProduct: (product: AdminProduct) => Promise<AdminProduct>
}

const emptyContent: AdminContent = {
  faqs: [],
  heroPrimaryButton: '',
  heroSecondaryButton: '',
  heroText: '',
  instagramHandle: '',
  schedule: '',
  storyText: '',
  testimonials: [],
  whatsappNumber: '',
}

function mapStatus(status: string): AdminProductStatus {
  if (status === 'draft' || status === 'hidden' || status === 'sold-out') {
    return status
  }

  return 'active'
}

function mapProduct(product: ApiProduct): AdminProduct {
  return {
    categoryId: product.categoryId,
    description: product.description,
    id: product.id,
    imageRecords: product.images,
    images: product.images.map((image) => image.src),
    intentionIds: product.intentionIds,
    name: product.name,
    offerPrice: product.compareAtPrice ? product.price : null,
    price: product.compareAtPrice ?? product.price,
    seoDescription: product.seo?.description ?? '',
    seoTitle: product.seo?.title ?? '',
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    status: mapStatus(product.status),
    stock: product.stock,
    subcategoryIds: [],
    tags: product.tags,
  }
}

function productPayload(product: AdminProduct) {
  const status =
    product.status === 'active'
      ? product.stock === 0
        ? 'sold-out'
        : product.stock <= 5
          ? 'low-stock'
          : 'available'
      : product.status

  return {
    bestseller: false,
    careInstructions: [],
    categoryId: product.categoryId,
    chakras: [],
    compareAtPrice: product.offerPrice ? product.price : null,
    description: product.description,
    dimensions: {},
    energeticProperties: [],
    featured: false,
    id: product.id,
    ingredients: [],
    intentionIds: product.intentionIds,
    isNew: false,
    materials: [],
    name: product.name,
    origin: {},
    price: product.offerPrice ?? product.price,
    ritual: {},
    seo: {
      description: product.seoDescription,
      keywords: product.tags,
      title: product.seoTitle,
    },
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    status,
    stock: product.stock,
    subtitle: '',
    sustainability: {},
    tags: product.tags,
    zodiacSigns: [],
  }
}

function normalizeOrder(order: AdminOrder): AdminOrder {
  return {
    ...order,
    items: order.items.map((item) => ({
      name: item.name,
      price: Number(item.price),
      productId: item.productId,
      quantity: item.quantity,
    })),
    total: Number(order.total),
  }
}

export const orderStatusLabels: Record<AdminOrderStatus, string> = {
  cancelled: 'Cancelado',
  confirmed: 'Confirmado',
  contacted: 'Contactado',
  delivered: 'Entregado',
  new: 'Nuevo',
  preparing: 'Preparando',
}

export const orderSourceLabels: Record<AdminOrderSource, string> = {
  store: 'Tienda',
  tiktok: 'TikTok Live',
  web: 'Web',
}

export const useAdminStore = create<AdminState>((set, get) => ({
  addOrder: async (order) => {
    try {
      const created = await apiFetch<AdminOrder>(
        '/admin/orders',
        {
          body: JSON.stringify({
            city: order.city,
            customerName: order.customer,
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            note: order.note,
            shippingMethod: order.deliveryType,
            source: order.source,
            whatsapp: order.whatsapp,
          }),
          method: 'POST',
        },
        true,
      )
      set((state) => ({
        orders: [normalizeOrder(created), ...state.orders],
      }))
      await get().hydrate()
      return { success: true }
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'No se pudo registrar.',
        success: false,
      }
    }
  },
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
  },
  content: emptyContent,
  categories: [],
  deleteProduct: async (productId) => {
    const hiddenProduct = await apiFetch<ApiProduct>(
      `/admin/products/${productId}`,
      { method: 'DELETE' },
      true,
    )
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId ? mapProduct(hiddenProduct) : product,
      ),
    }))
    notifyCatalogChanged()
  },
  dismissToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
  error: null,
  hydrate: async () => {
    set({ error: null, isLoading: true })

    try {
      const [apiProducts, orders, content, categories] = await Promise.all([
        apiFetch<ApiProduct[]>('/admin/products', { cache: 'no-store' }, true),
        apiFetch<AdminOrder[]>('/admin/orders', { cache: 'no-store' }, true),
        apiFetch<AdminContent>('/admin/content', { cache: 'no-store' }, true),
        apiFetch<AdminCategory[]>('/admin/categories', { cache: 'no-store' }, true),
      ])
      set({
        categories,
        content,
        isLoading: false,
        orders: orders.map(normalizeOrder),
        products: apiProducts.map(mapProduct),
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar el panel.',
        isLoading: false,
      })
    }
  },
  isLoading: false,
  orders: [],
  products: [],
  removeOrder: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((order) => order.id !== orderId),
    })),
  toasts: [],
  toggleProductVisibility: async (productId) => {
    const product = get().products.find((item) => item.id === productId)
    if (!product) return

    await get().upsertProduct({
      ...product,
      status: product.status === 'hidden' ? 'active' : 'hidden',
    })
  },
  updateContent: async (content) => {
    const updated = await apiFetch<AdminContent>(
      '/admin/content',
      { body: JSON.stringify(content), method: 'PUT' },
      true,
    )
    set({ content: updated })
  },
  updateOrderItems: async (orderId, items) => {
    try {
      const updated = await apiFetch<AdminOrder>(
        `/admin/orders/${orderId}/items`,
        {
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
          method: 'PATCH',
        },
        true,
      )
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? normalizeOrder(updated) : order,
        ),
      }))
      await get().hydrate()
      return { success: true }
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'No se pudo actualizar.',
        success: false,
      }
    }
  },
  updateOrderStatus: async (orderId, status) => {
    const updated = await apiFetch<AdminOrder>(
      `/admin/orders/${orderId}/status`,
      { body: JSON.stringify({ status }), method: 'PATCH' },
      true,
    )
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? normalizeOrder(updated) : order,
      ),
    }))
    await get().hydrate()
  },
  upsertProduct: async (product) => {
    const exists = get().products.some((item) => item.id === product.id)
    const saved = await apiFetch<ApiProduct>(
      exists ? `/admin/products/${product.id}` : '/admin/products',
      {
        body: JSON.stringify(productPayload(product)),
        method: exists ? 'PUT' : 'POST',
      },
      true,
    )
    const normalized = mapProduct(saved)
    set((state) => ({
      products: exists
        ? state.products.map((item) =>
            item.id === normalized.id ? normalized : item,
          )
        : [normalized, ...state.products],
    }))
    notifyCatalogChanged()
    return normalized
  },
}))
