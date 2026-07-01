import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="currentColor" viewBox="0 0 32 32">
      <path d="M16.02 4C9.4 4 4.02 9.28 4.02 15.78c0 2.08.56 4.11 1.62 5.9L4 28l6.49-1.66a12.2 12.2 0 0 0 5.53 1.34C22.6 27.68 28 22.4 28 15.9 28 9.39 22.6 4 16.02 4Zm0 21.66c-1.78 0-3.52-.47-5.04-1.37l-.36-.21-3.86.99 1.03-3.67-.24-.38a9.69 9.69 0 0 1-1.5-5.24c0-5.39 4.47-9.77 9.97-9.77 5.5 0 9.97 4.44 9.97 9.89 0 5.37-4.47 9.76-9.97 9.76Zm5.46-7.3c-.3-.15-1.77-.86-2.04-.95-.27-.1-.47-.15-.67.14-.2.3-.77.95-.94 1.14-.17.2-.35.22-.65.08-.3-.15-1.26-.46-2.4-1.46-.89-.78-1.49-1.74-1.66-2.03-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.58-.92-2.16-.24-.56-.49-.48-.67-.49h-.57c-.2 0-.52.08-.79.38-.27.3-1.04 1-1.04 2.42 0 1.43 1.07 2.8 1.22 3 .15.2 2.1 3.13 5.1 4.38.71.3 1.27.48 1.7.62.72.22 1.37.19 1.89.12.58-.08 1.77-.72 2.02-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.34Z" />
    </svg>
  )
}

/**
 * Floating WhatsApp shortcut with delayed bounce-in, pulse ring, tooltip and
 * scroll-velocity visibility behavior.
 */
export function FloatingWhatsApp() {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const lastTime = useRef(0)

  useEffect(() => {
    const mountTimeout = window.setTimeout(() => setMounted(true), 2000)

    return () => window.clearTimeout(mountTimeout)
  }, [])

  useEffect(() => {
    lastTime.current = window.performance.now()

    const handleScroll = () => {
      const now = window.performance.now()
      const currentY = window.scrollY
      const deltaY = currentY - lastScrollY.current
      const deltaTime = Math.max(1, now - lastTime.current)
      const velocity = Math.abs(deltaY / deltaTime)

      if (deltaY < -2) {
        setVisible(true)
      } else if (deltaY > 18 && velocity > 0.55) {
        setVisible(false)
      } else if (currentY < 120) {
        setVisible(true)
      }

      lastScrollY.current = currentY
      lastTime.current = now
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {mounted && visible ? (
        <motion.a
          animate={{ opacity: 1, scale: [0, 1.2, 0.95, 1] }}
          className="auralith-floating-whatsapp group fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_18px_45px_rgba(37,211,102,0.3)] will-change-transform"
          exit={{ opacity: 0, scale: 0 }}
          href="https://wa.me/51999999999"
          initial={{ opacity: 0, scale: 0 }}
          rel="noreferrer"
          target="_blank"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.1 }}
        >
          <WhatsAppIcon />
          <span className="pointer-events-none absolute right-[calc(100%+0.75rem)] whitespace-nowrap rounded-full bg-ink px-4 py-2 font-body text-xs text-cream-light opacity-0 shadow-soft transition-opacity duration-200 group-hover:opacity-100">
            ¿Necesitas ayuda?
          </span>
        </motion.a>
      ) : null}
    </AnimatePresence>
  )
}
