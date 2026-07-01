import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

gsap.registerPlugin(ScrollTrigger)

declare global {
  interface Window {
    __auralithLenis?: Lenis
  }
}

const lenis = new Lenis({
  duration: 1.12,
  easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
  gestureOrientation: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1,
})

window.__auralithLenis = lenis

const scroller = document.documentElement

lenis.on('scroll', ScrollTrigger.update)

ScrollTrigger.scrollerProxy(scroller, {
  scrollTop(value) {
    if (typeof value === 'number') {
      lenis.scrollTo(value, { immediate: true })
    }

    return lenis.scroll
  },
  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    }
  },
  pinType: scroller.style.transform ? 'transform' : 'fixed',
})

ScrollTrigger.defaults({ scroller })

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

ScrollTrigger.refresh()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
