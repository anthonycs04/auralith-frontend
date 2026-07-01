import { Grip } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from './utils'

type CursorMode = 'default' | 'drag' | 'interactive' | 'product'

function isProductTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(
    target.closest('.cursor-zoom-in') ||
      target.closest('article img') ||
      target.closest('a[href^="/producto/"] img') ||
      target.closest('a[href^="/producto/"]'),
  )
}

function resolveMode(target: EventTarget | null, isDragging: boolean): CursorMode {
  if (isDragging) {
    return 'drag'
  }

  if (!(target instanceof Element)) {
    return 'default'
  }

  if (target.closest('[data-cursor="drag"]')) {
    return 'drag'
  }

  if (target.closest('[data-cursor="product"]')) {
    return 'product'
  }

  if (isProductTarget(target)) {
    return 'product'
  }

  if (target.closest('a, button, [role="button"], input, select, textarea')) {
    return 'interactive'
  }

  return 'default'
}

/**
 * Desktop-only custom cursor with smoothed lerp tracking and contextual states
 * for links, product imagery and draggable admin cards.
 */
export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const modeRef = useRef<CursorMode>('default')
  const scaleRef = useRef(1)
  const targetX = useRef(0)
  const targetY = useRef(0)
  const currentX = useRef(0)
  const currentY = useRef(0)
  const isDragging = useRef(false)
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [mode, setMode] = useState<CursorMode>('default')

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateEnabled = () => setEnabled(pointerQuery.matches && !motionQuery.matches)

    updateEnabled()
    pointerQuery.addEventListener('change', updateEnabled)
    motionQuery.addEventListener('change', updateEnabled)

    return () => {
      pointerQuery.removeEventListener('change', updateEnabled)
      motionQuery.removeEventListener('change', updateEnabled)
    }
  }, [])

  useEffect(() => {
    scaleRef.current = mode === 'interactive' ? 2.5 : mode === 'product' ? 3 : mode === 'drag' ? 2.7 : 1
  }, [mode])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const setNextMode = (nextMode: CursorMode) => {
      if (modeRef.current !== nextMode) {
        modeRef.current = nextMode
        setMode(nextMode)
      }
    }

    const updateFromTarget = (target: EventTarget | null) => {
      setNextMode(resolveMode(target, isDragging.current))
    }

    const handlePointerMove = (event: PointerEvent) => {
      targetX.current = event.clientX
      targetY.current = event.clientY
      setVisible(true)
      updateFromTarget(event.target)
    }

    const handlePointerOver = (event: PointerEvent) => updateFromTarget(event.target)
    const handlePointerOut = (event: PointerEvent) => updateFromTarget(event.relatedTarget)
    const handlePointerLeave = () => setVisible(false)
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('[draggable="true"], [data-cursor="drag"]')
      ) {
        isDragging.current = true
        setNextMode('drag')
      }
    }
    const handlePointerUp = (event: PointerEvent) => {
      isDragging.current = false
      updateFromTarget(event.target)
    }
    const handleDragStart = () => {
      isDragging.current = true
      setNextMode('drag')
    }
    const handleDragEnd = (event: DragEvent) => {
      isDragging.current = false
      updateFromTarget(event.target)
    }

    const tick = () => {
      currentX.current += (targetX.current - currentX.current) * 0.15
      currentY.current += (targetY.current - currentY.current) * 0.15

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX.current - 6}px, ${currentY.current - 6}px, 0) scale(${scaleRef.current})`
      }

      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerover', handlePointerOver)
    window.addEventListener('pointerout', handlePointerOut)
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('dragstart', handleDragStart)
    window.addEventListener('dragend', handleDragEnd)

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
      }

      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerover', handlePointerOver)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('dragstart', handleDragStart)
      window.removeEventListener('dragend', handleDragEnd)
    }
  }, [enabled])

  if (!enabled) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'fixed left-0 top-0 z-[9999] grid h-3 w-3 place-items-center rounded-full border-[1.5px] border-gold/60 bg-cream text-[10px] font-medium leading-none text-ink pointer-events-none transition-[opacity,background-color,border-color,color,mix-blend-mode] duration-150',
        visible ? 'opacity-100' : 'opacity-0',
        mode === 'interactive' && 'mix-blend-difference',
        mode === 'product' && 'border-gold bg-cream text-ink shadow-gold',
        mode === 'drag' && 'border-gold bg-gold text-ink',
      )}
      ref={cursorRef}
    >
      {mode === 'product' ? <span className="font-body text-[10px]">Ver</span> : null}
      {mode === 'drag' ? <Grip className="h-2.5 w-2.5" /> : null}
    </div>
  )
}
