import type { CSSProperties, ReactNode } from 'react'

type SurfaceTone = 'default' | 'muted' | 'accent' | 'success' | 'warning' | 'danger'
type SurfacePadding = 'sm' | 'md' | 'lg'

interface SurfaceCardProps {
  children: ReactNode
  className?: string
  interactive?: boolean
  padding?: SurfacePadding
  style?: CSSProperties
  tone?: SurfaceTone
}

export function SurfaceCard({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  style,
  tone = 'default',
}: SurfaceCardProps) {
  const classes = [
    'surface-card',
    `surface-card--${tone}`,
    `surface-card--pad-${padding}`,
    interactive ? 'surface-card--interactive' : '',
    className,
  ].filter(Boolean).join(' ')

  return <div className={classes} style={style}>{children}</div>
}

interface SectionHeaderProps {
  actions?: ReactNode
  className?: string
  description?: ReactNode
  eyebrow?: ReactNode
  meta?: ReactNode
  title: ReactNode
}

export function SectionHeader({
  actions,
  className = '',
  description,
  eyebrow,
  meta,
  title,
}: SectionHeaderProps) {
  return (
    <div className={`section-header ${className}`.trim()}>
      <div className="section-header-main">
        {eyebrow && <div className="section-eyebrow">{eyebrow}</div>}
        <div className="section-heading-row">
          <h2 className="section-heading">{title}</h2>
          {meta && <div className="section-meta">{meta}</div>}
        </div>
        {description && <div className="section-description">{description}</div>}
      </div>
      {actions && <div className="section-actions">{actions}</div>}
    </div>
  )
}

interface MetricTileProps {
  detail?: ReactNode
  label: ReactNode
  tone?: SurfaceTone
  value: ReactNode
}

export function MetricTile({ detail, label, tone = 'default', value }: MetricTileProps) {
  return (
    <SurfaceCard className="metric-tile" padding="sm" tone={tone}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {detail && <div className="metric-detail">{detail}</div>}
    </SurfaceCard>
  )
}

interface StatusPillProps {
  children: ReactNode
  tone?: SurfaceTone
}

export function StatusPill({ children, tone = 'default' }: StatusPillProps) {
  return <span className={`product-pill product-pill--${tone}`}>{children}</span>
}
