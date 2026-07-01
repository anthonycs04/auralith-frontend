import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItemInput = {
  categoryId?: string
  id: string
  image: string
  intention?: string
  name: string
  price: number
  sku?: string
  slug?: string
}

export type CartItem = CartItemInput & {
  quantity: number
}

export type CartTotals = {
  itemCount: number
  subtotal: number
}

type CartState = {
  addItem: (item: CartItemInput, quantity?: number) => void
  clearCart: () => void
  getItemQuantity: (productId: string) => number
  isOpen: boolean
  items: CartItem[]
  removeItem: (productId: string) => void
  toggleDrawer: (open?: boolean) => void
  totals: CartTotals
  updateQuantity: (productId: string, quantity: number) => void
}

type PersistedCartItem = Partial<CartItem> & {
  product?: Partial<CartItemInput>
}

type PersistedCartState = Partial<Omit<CartState, 'addItem' | 'clearCart' | 'getItemQuantity' | 'removeItem' | 'toggleDrawer' | 'updateQuantity'>> & {
  items?: PersistedCartItem[]
}

function calculateTotals(items: CartItem[]): CartTotals {
  return items.reduce(
    (totals, item) => ({
      itemCount: totals.itemCount + item.quantity,
      subtotal: totals.subtotal + item.price * item.quantity,
    }),
    { itemCount: 0, subtotal: 0 },
  )
}

function normalizeCartItem(item: PersistedCartItem): CartItem | null {
  const source = item.product ?? item
  const id = source.id
  const name = source.name
  const price = source.price
  const image = source.image

  if (!id || !name || typeof price !== 'number' || !image) {
    return null
  }

  return {
    categoryId: source.categoryId,
    id,
    image,
    intention: source.intention ?? item.intention ?? 'Ritual',
    name,
    price,
    quantity: Math.max(1, Number(item.quantity ?? 1)),
    sku: source.sku,
    slug: source.slug,
  }
}

function normalizeItems(items: PersistedCartItem[] | undefined): CartItem[] {
  return (items ?? [])
    .map((item) => normalizeCartItem(item))
    .filter((item): item is CartItem => Boolean(item))
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id)
          const items = existingItem
            ? state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              )
            : [
                ...state.items,
                {
                  ...product,
                  intention: product.intention ?? 'Ritual',
                  quantity,
                },
              ]

          return { items, totals: calculateTotals(items) }
        })
      },
      clearCart: () => set({ items: [], totals: calculateTotals([]) }),
      getItemQuantity: (productId) => {
        return get().items.find((item) => item.id === productId)?.quantity ?? 0
      },
      isOpen: false,
      items: [],
      removeItem: (productId) => {
        set((state) => {
          const items = state.items.filter((item) => item.id !== productId)

          return { items, totals: calculateTotals(items) }
        })
      },
      toggleDrawer: (open) =>
        set((state) => ({
          isOpen: typeof open === 'boolean' ? open : !state.isOpen,
        })),
      totals: calculateTotals([]),
      updateQuantity: (productId, quantity) => {
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((item) => item.id !== productId)
              : state.items.map((item) =>
                  item.id === productId ? { ...item, quantity } : item,
                )

          return { items, totals: calculateTotals(items) }
        })
      },
    }),
    {
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedCartState | undefined
        const items = normalizeItems(persisted?.items)

        return {
          ...currentState,
          ...persisted,
          isOpen: false,
          items,
          totals: calculateTotals(items),
        }
      },
      name: 'auralith-cart',
      partialize: (state) => ({
        items: state.items,
        totals: state.totals,
      }),
      version: 2,
    },
  ),
)

export type CartProductSnapshot = CartItemInput
