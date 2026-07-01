import { create } from 'zustand'
import {
  categories,
  intentions,
  products,
  type Category,
  type CategoryId,
  type Intention,
  type IntentionId,
  type Product,
  type ProductStatus,
} from '../data'
import { apiFetch } from '../lib/api'
import type { AdminContent } from './useAdminStore'

type ApiCategory = Omit<Category, 'id' | 'image' | 'intentionIds'> & {
  id: string
  imageUrl: string | null
  intentionIds: string[]
}

type ApiIntention = Omit<
  Intention,
  'id' | 'recommendedProductIds' | 'relatedCategoryIds'
> & {
  id: string
  recommendedProductIds: string[]
  relatedCategoryIds: string[]
}

type ApiProduct = Omit<
  Product,
  'categoryId' | 'images' | 'intentionIds' | 'status'
> & {
  categoryId: string
  images: Array<{
    altText: string
    height: number | null
    isPrimary: boolean
    src: string
    width: number | null
  }>
  intentionIds: string[]
  status: string
}

type CatalogState = {
  content: AdminContent | null
  error: string | null
  hydrate: () => Promise<void>
  isLoading: boolean
  version: number
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
}

function mapDimensions(value: Product['dimensions'] | Record<string, unknown> | null | undefined): Product['dimensions'] {
  return {
    depthCm: typeof value?.depthCm === 'number' ? value.depthCm : null,
    heightCm: typeof value?.heightCm === 'number' ? value.heightCm : null,
    weightGrams: typeof value?.weightGrams === 'number' ? value.weightGrams : 0,
    widthCm: typeof value?.widthCm === 'number' ? value.widthCm : null,
  }
}

function mapOrigin(value: Product['origin'] | Record<string, unknown> | null | undefined): Product['origin'] {
  return {
    country: 'Peru',
    maker: typeof value?.maker === 'string' ? value.maker : 'Auralith',
    region: typeof value?.region === 'string' ? value.region : 'Peru',
  }
}

function mapRitual(
  value: Product['ritual'] | Record<string, unknown> | null | undefined,
  productName: string,
): Product['ritual'] {
  return {
    durationMinutes:
      typeof value?.durationMinutes === 'number' ? value.durationMinutes : 10,
    frequency:
      typeof value?.frequency === 'string'
        ? value.frequency
        : 'Uso intuitivo segun tu ritual.',
    steps: asStringArray(value?.steps).length
      ? asStringArray(value?.steps)
      : [
          `Respira profundo y conecta con ${productName}.`,
          'Colocalo cerca de tu espacio de intencion.',
          'Cierra el ritual agradeciendo la energia recibida.',
        ],
    summary:
      typeof value?.summary === 'string'
        ? value.summary
        : 'Una pieza seleccionada para acompanar intenciones personales y rituales cotidianos.',
  }
}

function mapSeo(
  value: Product['seo'] | Record<string, unknown> | null | undefined,
  productName: string,
  shortDescription: string,
): Product['seo'] {
  return {
    description:
      typeof value?.description === 'string' ? value.description : shortDescription,
    keywords: asStringArray(value?.keywords),
    title: typeof value?.title === 'string' ? value.title : `${productName} | Auralith`,
  }
}

function mapSustainability(
  value: Product['sustainability'] | Record<string, unknown> | null | undefined,
): Product['sustainability'] {
  return {
    impact:
      typeof value?.impact === 'string'
        ? value.impact
        : 'Seleccion consciente para uso prolongado.',
    packaging:
      typeof value?.packaging === 'string'
        ? value.packaging
        : 'Empaque cuidado para envio seguro.',
    sourcing:
      typeof value?.sourcing === 'string'
        ? value.sourcing
        : 'Curaduria holistica de Auralith.',
  }
}

function mapCategory(category: ApiCategory): Category {
  return {
    ...category,
    id: category.id as CategoryId,
    image: category.imageUrl ?? '',
    intentionIds: category.intentionIds as IntentionId[],
  }
}

function mapIntention(intention: ApiIntention): Intention {
  return {
    ...intention,
    id: intention.id as IntentionId,
    relatedCategoryIds: intention.relatedCategoryIds as CategoryId[],
  }
}

function mapProduct(product: ApiProduct): Product {
  const shortDescription =
    product.shortDescription || product.description || 'Producto holistico seleccionado por Auralith.'

  return {
    ...product,
    careInstructions: asStringArray(product.careInstructions),
    categoryId: product.categoryId as CategoryId,
    chakras: asStringArray(product.chakras),
    description: product.description || shortDescription,
    dimensions: mapDimensions(product.dimensions),
    energeticProperties: asStringArray(product.energeticProperties),
    images: product.images.map((image) => ({
      alt: image.altText,
      height: image.height ?? 1200,
      isPrimary: image.isPrimary,
      src: image.src,
      width: image.width ?? 1200,
    })),
    ingredients: asStringArray(product.ingredients),
    intentionIds: product.intentionIds as IntentionId[],
    materials: asStringArray(product.materials),
    origin: mapOrigin(product.origin),
    ritual: mapRitual(product.ritual, product.name),
    seo: mapSeo(product.seo, product.name, shortDescription),
    shortDescription,
    status: product.status as ProductStatus,
    sustainability: mapSustainability(product.sustainability),
    tags: asStringArray(product.tags),
    zodiacSigns: asStringArray(product.zodiacSigns),
  }
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  content: null,
  error: null,
  hydrate: async () => {
    if (get().isLoading) {
      return
    }

    set({ error: null, isLoading: true })

    try {
      const [apiProducts, apiCategories, apiIntentions, content] =
        await Promise.all([
          apiFetch<ApiProduct[]>('/catalog/products'),
          apiFetch<ApiCategory[]>('/catalog/categories'),
          apiFetch<ApiIntention[]>('/catalog/intentions'),
          apiFetch<AdminContent>('/content'),
        ])

      products.splice(0, products.length, ...apiProducts.map(mapProduct))
      categories.splice(0, categories.length, ...apiCategories.map(mapCategory))
      intentions.splice(0, intentions.length, ...apiIntentions.map(mapIntention))

      set((state) => ({
        content,
        isLoading: false,
        version: state.version + 1,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo cargar la tienda.',
        isLoading: false,
      })
    }
  },
  isLoading: false,
  version: 0,
}))
