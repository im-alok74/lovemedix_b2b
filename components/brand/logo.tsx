import { cn } from '@/lib/utils'

/**
 * Lovemedix mark: a rounded square with a medical cross. `onColor` inverts it for
 * use on the primary-colored panels (auth hero, CTA band).
 */
export function LogoMark({ className, onColor = false }: { className?: string; onColor?: boolean }) {
  const bg = onColor ? '#ffffff' : 'var(--primary)'
  const fg = onColor ? 'var(--primary)' : 'var(--primary-foreground)'
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden role="img">
      <rect width="32" height="32" rx="9" fill={bg} />
      <g stroke={fg} strokeWidth="3.6" strokeLinecap="round">
        <path d="M16 8v16" />
        <path d="M8 16h16" />
      </g>
    </svg>
  )
}

export function Logo({
  className,
  href = '/',
  size = 'md',
  subtitle,
  onColor = false,
}: {
  className?: string
  href?: string | null
  size?: 'sm' | 'md'
  subtitle?: string
  onColor?: boolean
}) {
  const inner = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'} onColor={onColor} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-semibold tracking-tight',
            size === 'sm' ? 'text-sm' : 'text-[17px]',
            onColor ? 'text-white' : 'text-foreground',
          )}
        >
          Love<span className={onColor ? 'text-white/80' : 'text-primary'}>medix</span>
        </span>
        {subtitle ? (
          <span className={cn('mt-0.5 text-[11px] font-medium', onColor ? 'text-white/70' : 'text-muted-foreground')}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </span>
  )
  if (!href) return inner
  return (
    <a href={href} className="inline-flex" aria-label="Lovemedix home">
      {inner}
    </a>
  )
}
