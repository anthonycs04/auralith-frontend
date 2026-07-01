import { useEffect, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'
import { FloatingWhatsApp } from '../ui/FloatingWhatsApp'
import { GlobalScrollEffects } from '../ui/GlobalScrollEffects'
import { ScrollToTop } from '../ui/ScrollToTop'
import { CookieConsent } from '../ui/CookieConsent'
import { Footer } from './Footer'
import { Header } from './Header'
import { useCatalogStore } from '../../store'

export function Layout({ children }: PropsWithChildren) {
  const location = useLocation()
  const hydrateCatalog = useCatalogStore((state) => state.hydrate)

  useEffect(() => {
    void hydrateCatalog()
  }, [hydrateCatalog])

  useEffect(() => {
    if (!location.hash) {
      return undefined
    }

    const targetId = decodeURIComponent(location.hash.slice(1))
    const timeout = window.setTimeout(() => {
      const target = document.getElementById(targetId)

      if (!target) {
        return
      }

      if (window.__auralithLenis) {
        window.__auralithLenis.scrollTo(target, { duration: 1.05, offset: -88 })
        return
      }

      window.scrollTo({
        behavior: 'smooth',
        top: target.getBoundingClientRect().top + window.scrollY - 88,
      })
    }, 80)

    return () => window.clearTimeout(timeout)
  }, [location.hash, location.pathname])

  return (
    <>
      <GlobalScrollEffects />
      <Header />
      {children}
      <Footer />
      <CookieConsent />
      <FloatingWhatsApp />
      <ScrollToTop />
    </>
  )
}
