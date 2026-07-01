import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isLightHeading(heading: HTMLElement) {
  const style = window.getComputedStyle(heading)
  const fontSize = Number.parseFloat(style.fontSize)
  const sectionClassName = heading.closest('section')?.className.toString() ?? ''
  const textColor = style.color

  return (
    style.fontFamily.includes('The Seasons') &&
    fontSize >= 30 &&
    !sectionClassName.includes('bg-ink') &&
    !sectionClassName.includes('bg-[#222222]') &&
    !textColor.includes('245, 241, 232') &&
    !textColor.includes('250, 248, 243')
  )
}

function isSectionImage(image: HTMLImageElement) {
  const rect = image.getBoundingClientRect()
  const parentElement = image.parentElement

  return (
    rect.width >= 180 &&
    rect.height >= 180 &&
    Boolean(image.closest('section')) &&
    Boolean(parentElement) &&
    parentElement !== null &&
    window.getComputedStyle(parentElement).overflow !== 'visible' &&
    !image.closest('.cursor-zoom-in') &&
    !image.closest('[data-no-global-parallax]') &&
    !image.closest('article') &&
    !image.closest('button') &&
    !image.closest('[role="dialog"]')
  )
}

/**
 * Public-site animation polish: heading scrub reveal, section-image parallax
 * and route-aware lazy image fade-in.
 */
export function GlobalScrollEffects() {
  const location = useLocation()

  useEffect(() => {
    const cleanupHandlers: Array<() => void> = []
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '120px' },
    )
    const images = Array.from(
      document.querySelectorAll<HTMLImageElement>('main img:not([data-auralith-lazy])'),
    )

    images.forEach((image) => {
      image.dataset.auralithLazy = 'true'
      image.decoding = 'async'

      if (!image.loading) {
        image.loading = 'lazy'
      }

      image.classList.add('auralith-lazy-image')

      const markLoaded = () => image.classList.add('is-loaded')

      if (image.complete) {
        markLoaded()
      } else {
        image.addEventListener('load', markLoaded, { once: true })
        cleanupHandlers.push(() => image.removeEventListener('load', markLoaded))
      }

      observer.observe(image)
    })

    return () => {
      observer.disconnect()
      cleanupHandlers.forEach((cleanup) => cleanup())
    }
  }, [location.pathname])

  useEffect(() => {
    if (isReducedMotion()) {
      return
    }

    const context = gsap.context(() => {
      const headings = Array.from(
        document.querySelectorAll<HTMLElement>('main section h1, main section h2'),
      ).filter(isLightHeading)
      const sectionImages = Array.from(
        document.querySelectorAll<HTMLImageElement>('main section [class*="overflow-hidden"] > img'),
      ).filter(isSectionImage)

      headings.forEach((heading) => {
        gsap.fromTo(
          heading,
          { color: 'rgba(34, 34, 34, 0.1)' },
          {
            color: 'rgba(34, 34, 34, 1)',
            ease: 'none',
            scrollTrigger: {
              end: 'bottom 48%',
              scrub: true,
              start: 'top 82%',
              trigger: heading,
            },
          },
        )
      })

      sectionImages.forEach((image) => {
        gsap.fromTo(
          image,
          { y: -30 },
          {
            ease: 'none',
            scrollTrigger: {
              end: 'bottom top',
              scrub: 1.5,
              start: 'top bottom',
              trigger: image.parentElement,
            },
            y: 30,
          },
        )
      })

      ScrollTrigger.refresh()
    })

    return () => context.revert()
  }, [location.pathname])

  return null
}
