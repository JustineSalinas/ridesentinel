import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold', {
  variants: {
    tone: {
      verified: 'bg-green-50 text-verified',
      pending: 'bg-amber-50 text-pending',
      danger: 'bg-red-50 text-danger',
      neutral: 'bg-mist text-slate',
      brand: 'bg-blue-50 text-brand-dark',
    },
  },
  defaultVariants: { tone: 'neutral' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
