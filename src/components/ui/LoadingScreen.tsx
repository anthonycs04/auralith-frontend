import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'auralith-loading-seen'

/**
 * First-visit loading screen with Auralith logo, gold progress line and
 * clip-path exit.
 */
export function LoadingScreen() {
  const [mounted, setMounted] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return !window.localStorage.getItem(STORAGE_KEY)
  })
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!mounted) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, 'true')

    const exitTimeout = window.setTimeout(() => setExiting(true), 1450)
    const unmountTimeout = window.setTimeout(() => setMounted(false), 2150)

    return () => {
      window.clearTimeout(exitTimeout)
      window.clearTimeout(unmountTimeout)
    }
  }, [mounted])

  return (
    <AnimatePresence>
      {mounted ? (
        <motion.div
          animate={
            exiting
              ? {
                  clipPath: 'inset(100% 0 0 0)',
                }
              : {
                  clipPath: 'inset(0 0 0 0)',
                }
          }
          className="fixed inset-0 z-[150] grid place-items-center bg-cream"
          exit={{ opacity: 0 }}
          initial={{ clipPath: 'inset(0 0 0 0)' }}
          transition={{ duration: 0.68, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            animate={
              exiting
                ? { opacity: 0, scale: 1.08 }
                : { opacity: 1, scale: 1 }
            }
            className="w-72 text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-display text-5xl tracking-widest text-ink">
              AURALITH
            </p>
            <div className="mx-auto mt-8 h-px w-56 overflow-hidden bg-gold/20">
              <motion.div
                animate={{ scaleX: 1 }}
                className="h-full origin-left bg-gold"
                initial={{ scaleX: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
