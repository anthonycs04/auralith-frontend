export type CurrencyCode = 'PEN'

export type CategoryId =
  | 'crystals-minerals'
  | 'sahumos-aromas'
  | 'ritual-kits'
  | 'home-altar'
  | 'energetic-jewelry'
  | 'oracles-guides'
  | 'holistic-care'

export type IntentionId =
  | 'self-love'
  | 'energy-cleansing'
  | 'protection'
  | 'abundance'
  | 'calm-sleep'
  | 'clarity-focus'

export type ProductStatus = 'available' | 'low-stock' | 'sold-out' | 'preorder'

export type ProductImage = {
  alt: string
  height: number
  isPrimary: boolean
  src: string
  width: number
}

export type SeoMeta = {
  description: string
  keywords: string[]
  title: string
}

export type Category = {
  accentColor: string
  description: string
  featured: boolean
  heroCopy: string
  id: CategoryId
  image: string
  intentionIds: IntentionId[]
  name: string
  productCount: number
  seo: SeoMeta
  shortName: string
  slug: string
  sortOrder: number
}

export type Intention = {
  affirmation: string
  benefits: string[]
  color: string
  description: string
  icon: string
  id: IntentionId
  name: string
  recommendedProductIds: string[]
  relatedCategoryIds: CategoryId[]
  ritualPrompt: string
  seo: SeoMeta
  slug: string
  sortOrder: number
}

export type Product = {
  bestseller: boolean
  careInstructions: string[]
  categoryId: CategoryId
  chakras: string[]
  compareAtPrice: number | null
  currency: CurrencyCode
  description: string
  dimensions: {
    depthCm: number | null
    heightCm: number | null
    weightGrams: number
    widthCm: number | null
  }
  energeticProperties: string[]
  featured: boolean
  id: string
  images: ProductImage[]
  ingredients: string[]
  intentionIds: IntentionId[]
  isNew: boolean
  materials: string[]
  name: string
  origin: {
    country: 'Peru'
    maker: string
    region: string
  }
  price: number
  ritual: {
    durationMinutes: number
    frequency: string
    steps: string[]
    summary: string
  }
  seo: SeoMeta
  shortDescription: string
  sku: string
  slug: string
  status: ProductStatus
  stock: number
  subtitle: string
  sustainability: {
    impact: string
    packaging: string
    sourcing: string
  }
  tags: string[]
  zodiacSigns: string[]
}
