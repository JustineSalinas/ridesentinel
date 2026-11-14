import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md',
        danger: 'bg-danger text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-md',
        outline: 'border border-mist bg-paper text-ink hover:-translate-y-0.5 hover:border-ink/25 hover:bg-mist/60 hover:shadow-sm',
        outlineDanger: 'border border-danger text-danger bg-paper hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-sm',
        ghost: 'text-slate hover:bg-mist/60',
        success: 'bg-verified text-white shadow-sm hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-md',
        heroPrimary: 'rounded-full bg-brand text-white shadow-sm hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-md',
        heroOutline:
          'rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/10',
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
