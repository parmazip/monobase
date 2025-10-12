/**
 * Logo Component
 * Monobase Provider Portal branding
 */

interface LogoProps {
  variant?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ variant = 'horizontal', size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  }

  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <span className="text-primary">MONOBASE</span>
      {variant === 'vertical' && <div className="text-xs text-muted-foreground">Provider Portal</div>}
    </div>
  )
}
