import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white hover:bg-brand-dark',
        danger: 'bg-danger text-white hover:bg-red-700',
        outline: 'border border-mist bg-paper text-ink hover:bg-mist/60',
        outlineDanger: 'border border-danger text-danger bg-paper hover:bg-red-50',
        ghost: 'text-slate hover:bg-mist/60',
        success: 'bg-verified text-white hover:bg-green-700',
        heroPrimary: 'rounded-full bg-brand text-white hover:bg-brand-dark',
        heroOutline: 'rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10',
      },
      size: {
        default: 'h-11 px-4',
        lg: 'h-[52px] px-5 text-base',
        sm: 'h-9 px-3 text-xs',
        pill: 'h-9 px-4 text-[13px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'lg',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
