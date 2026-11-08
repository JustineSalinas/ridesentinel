import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-12 w-full rounded-xl border border-mist bg-paper px-3.5 text-[15px] text-ink placeholder:text-slate/60',
        'focus-visible:border-brand',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
