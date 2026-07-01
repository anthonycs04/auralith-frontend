import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Bottom-left scroll-to-top control that delegates to Lenis when available.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400)

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    if (window.__auralithLenis) {
      window.__auralithLenis.scrollTo(0, { duration: 1.2 })
      return
    }

    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          animate={{ opacity: 1, scale: 1, y: 0 }}
          aria-label="Volver arriba"
          className="fixed bottom-6 left-6 z-50 grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-cream-light/90 text-gold shadow-soft backdrop-blur-md transition-colors hover:bg-gold hover:text-ink will-change-transform"
          exit={{ opacity: 0, scale: 0.86, y: 10 }}
          initial={{ opacity: 0, scale: 0.86, y: 10 }}
          onClick={scrollToTop}
          transition={{ damping: 22, stiffness: 260, type: 'spring' }}
          type="button"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
