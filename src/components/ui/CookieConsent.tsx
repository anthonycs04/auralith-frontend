import { AnimatePresence, motion } from 'framer-motion'
import { Cookie, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const COOKIE_KEY = 'auralith-cookie-consent'

/**
 * Stores the visitor's cookie preference locally and keeps the legal notice
 * available without interrupting navigation.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(
    () => !window.localStorage.getItem(COOKIE_KEY),
  )

  const savePreference = (preference: 'accepted' | 'necessary') => {
    window.localStorage.setItem(COOKIE_KEY, preference)
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          animate={{ opacity: 1, y: 0 }}
          aria-label="Preferencias de cookies"
          className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-3xl rounded-xl border border-gold/25 bg-cream-light p-5 shadow-lifted md:bottom-6 md:p-6"
          exit={{ opacity: 0, y: 18 }}
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            aria-label="Cerrar aviso de cookies"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-gold/10 hover:text-ink"
            onClick={() => savePreference('necessary')}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-4 pr-8">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold-dark">
              <Cookie className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-2xl text-ink">
                Tu privacidad importa
              </h2>
              <p className="mt-2 font-body text-sm font-light leading-relaxed text-ink-muted">
                Usamos almacenamiento necesario para conservar carrito y
                preferencias. Las cookies opcionales solo se activan con tu
                consentimiento.{' '}
                <Link className="font-medium text-gold-dark underline" to="/privacidad">
                  Ver política
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="h-11 rounded-full border border-gold/35 px-5 font-body text-sm text-gold-dark hover:bg-gold/10"
              onClick={() => savePreference('necessary')}
              type="button"
            >
              Solo necesarias
            </button>
            <button
              className="h-11 rounded-full bg-gold px-5 font-body text-sm font-semibold text-ink hover:bg-gold-light"
              onClick={() => savePreference('accepted')}
              type="button"
            >
              Aceptar todas
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
