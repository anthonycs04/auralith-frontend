import type { HTMLAttributes } from 'react'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean
}

export function Card({ interactive = false, ...props }: CardProps) {
  return <div data-interactive={interactive || undefined} {...props} />
}
