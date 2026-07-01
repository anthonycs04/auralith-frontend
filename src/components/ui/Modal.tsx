import type { PropsWithChildren } from 'react'

export type ModalProps = PropsWithChildren<{
  labelledBy?: string
  onClose?: () => void
  open: boolean
}>

export function Modal({ children, labelledBy, onClose, open }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div aria-labelledby={labelledBy} aria-modal="true" role="dialog">
      <button aria-label="Cerrar modal" onClick={onClose} type="button" />
      {children}
    </div>
  )
}
