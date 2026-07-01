import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState, type ReactNode } from 'react'
import { cn } from './utils'

export type AccordionItemData = {
  answer: ReactNode
  id: string
  question: ReactNode
}

export type AccordionProps = {
  allowMultiple?: boolean
  className?: string
  defaultOpenIds?: string[]
  items: AccordionItemData[]
}

/**
 * Accessible FAQ accordion with animated height reveal and rotating plus icon.
 */
export function Accordion({
  allowMultiple = false,
  className,
  defaultOpenIds = [],
  items,
}: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds)

  const toggleItem = useCallback(
    (id: string) => {
      setOpenIds((current) => {
        const isOpen = current.includes(id)

        if (isOpen) {
          return current.filter((item) => item !== id)
        }

        return allowMultiple ? [...current, id] : [id]
      })
    },
    [allowMultiple],
  )

  return (
    <div className={cn('divide-y divide-gold/20', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id)
        const contentId = `accordion-content-${item.id}`

        return (
          <div key={item.id}>
            <button
              aria-controls={contentId}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left font-body text-sm font-medium text-ink transition-colors duration-300 hover:text-gold-dark"
              onClick={() => toggleItem(item.id)}
              type="button"
            >
              <span>{item.question}</span>
              <motion.span
                aria-hidden="true"
                className="relative h-5 w-5 shrink-0 overflow-hidden text-gold"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ damping: 20, stiffness: 400, type: 'spring' }}
              >
                <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-current" />
                <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-current" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  id={contentId}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="pb-5 pr-10 font-body text-sm font-light leading-relaxed text-ink-muted">
                    {item.answer}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
