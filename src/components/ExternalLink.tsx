import type { ReactNode } from 'react'
import { useLang } from '../i18n/LangContext'
import { ArrowOut } from './Icons'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  variant?: 'solid' | 'ghost' | 'text'
}

export function ExternalLink({ href, children, variant = 'ghost' }: ExternalLinkProps) {
  const { t } = useLang()
  return (
    <a className={`btn btn--${variant}`} href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <ArrowOut />
      <span className="visually-hidden">({t.ui.external})</span>
    </a>
  )
}
