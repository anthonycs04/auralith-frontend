import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

type TransitionState = {
  direction: number
  id: number
}

const routeOrder = [
  '/',
  '/tienda',
  '/producto',
  '/carrito',
  '/privacidad',
  '/libro-de-reclamaciones',
  '/admin/login',
  '/admin',
  '/admin/productos',
  '/admin/pedidos',
  '/admin/contenido',
]

function routeIndex(pathname: string) {
  const index = routeOrder.findIndex((path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path),
  )

  return index === -1 ? routeOrder.length : index
}

/**
 * Route-change overlay with a sage vertical wipe and brief centered brand mark.
 */
export function PageTransition() {
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  const [transition, setTransition] = useState<TransitionState | null>(null)

  useEffect(() => {
    if (previousPath.current === location.pathname) {
      return
    }

    const direction =
      routeIndex(location.pathname) >= routeIndex(previousPath.current) ? 1 : -1

    previousPath.current = location.pathname
    setTransition({ direction, id: Date.now() })

    const timeout = window.setTimeout(() => setTransition(null), 620)

    return () => window.clearTimeout(timeout)
  }, [location.pathname])

  return (
    <AnimatePresence custom={transition?.direction ?? 1}>
      {transition ? (
        <motion.div
          animate={{ y: ['100%', '0%', '0%', '-100%'] }}
          className="pointer-events-none fixed inset-0 z-[135] grid place-items-center bg-sage/80 backdrop-blur-[2px]"
          custom={transition.direction}
          exit={{ opacity: 0 }}
          initial={{ y: '100%' }}
          key={transition.id}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.42, 0.66, 1],
          }}
        >
          <motion.div
            animate={{ opacity: [0, 1, 1, 0], scale: [0.96, 1, 1, 1.04] }}
            className="text-center"
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.32, 0.66, 1],
            }}
          >
            <p className="font-display text-4xl tracking-widest text-cream-light md:text-6xl">
              AURALITH
            </p>
            <p className="mt-2 font-body text-xs uppercase tracking-[0.32em] text-gold-light">
              Tienda Holística
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
